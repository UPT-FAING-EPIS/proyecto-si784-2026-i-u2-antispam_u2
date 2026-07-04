from __future__ import annotations

import ipaddress
import time
from collections import defaultdict, deque
from datetime import datetime

from ..database import SessionLocal
from ..models import IdsAlert

# Detection thresholds
RULES = {
    "port_scan": {"enabled": True, "time_window_seconds": 10, "unique_ports_threshold": 10},
    "icmp_flood": {"enabled": True, "time_window_seconds": 5, "packet_threshold": 20},
    "syn_flood": {"enabled": True, "time_window_seconds": 5, "packet_threshold": 30},
    "brute_force": {
        "enabled": True,
        "time_window_seconds": 30,
        "attempt_threshold": 5,
        "ports": {"FTP": 21, "SSH": 22, "TELNET": 23, "RDP": 3389},
    },
    "connection_frequency": {"enabled": True, "time_window_seconds": 10, "packet_threshold": 100},
    "suspicious_ports": {"enabled": True, "ports": [21, 22, 23, 3389, 4444, 5900]},
    "rare_ports": {"enabled": True, "ports": [1337, 2323, 31337, 5555, 6667, 9001]},
}

COOLDOWN_SECONDS = 10

_port_scan_history: dict = defaultdict(deque)
_icmp_history: dict = defaultdict(deque)
_syn_history: dict = defaultdict(deque)
_brute_force_history: dict = defaultdict(deque)
_connection_frequency_history: dict = defaultdict(deque)
_last_alert_times: dict = {}


def _save_alert(level: str, alert_type: str, source_ip: str, description: str) -> None:
    key = (alert_type, source_ip)
    now = time.time()
    if now - _last_alert_times.get(key, 0) < COOLDOWN_SECONDS:
        return
    _last_alert_times[key] = now

    print(f"[AEGIS-IDS] {level} | {alert_type} | {source_ip} | {description}")
    db = SessionLocal()
    try:
        alert = IdsAlert(
            level=level,
            type=alert_type,
            source_ip=source_ip,
            description=description,
            timestamp=datetime.utcnow(),
        )
        db.add(alert)
        db.commit()
    except Exception as exc:
        db.rollback()
        print(f"[AEGIS-IDS] Error guardando alerta: {exc}")
    finally:
        db.close()


def _cleanup(history: deque, time_window: int) -> None:
    now = time.time()
    while history and now - history[0][0] > time_window:
        history.popleft()


def _on_packet(packet) -> None:
    try:
        from scapy.layers.inet import IP, TCP, ICMP  # noqa: PLC0415

        if not packet.haslayer(IP):
            return

        source_ip = packet[IP].src

        if packet.haslayer(TCP):
            tcp = packet[TCP]
            dport = int(tcp.dport)
            flags = str(tcp.flags)

            _detect_port_scan(source_ip, dport)
            _detect_syn_flood(source_ip, flags)
            _detect_brute_force(source_ip, dport)
            _detect_connection_frequency(source_ip)
            _detect_suspicious_port(source_ip, dport)
            _detect_rare_port(source_ip, dport)

        if packet.haslayer(ICMP):
            _detect_icmp_flood(source_ip)

    except Exception:
        pass


def _detect_port_scan(source_ip: str, dport: int) -> None:
    rule = RULES["port_scan"]
    if not rule["enabled"]:
        return
    tw = rule["time_window_seconds"]
    history = _port_scan_history[source_ip]
    history.append((time.time(), dport))
    _cleanup(history, tw)
    unique = {p for _, p in history}
    if len(unique) >= rule["unique_ports_threshold"]:
        _save_alert("ALTO", "ESCANEO_DE_PUERTOS", source_ip, f"Acceso a {len(unique)} puertos diferentes en {tw}s")
        history.clear()


def _detect_icmp_flood(source_ip: str) -> None:
    rule = RULES["icmp_flood"]
    if not rule["enabled"]:
        return
    tw = rule["time_window_seconds"]
    history = _icmp_history[source_ip]
    history.append((time.time(), "ICMP"))
    _cleanup(history, tw)
    if len(history) >= rule["packet_threshold"]:
        _save_alert("MEDIO", "ICMP_FLOOD", source_ip, f"{len(history)} paquetes ICMP en {tw}s")
        history.clear()


def _detect_syn_flood(source_ip: str, flags: str) -> None:
    rule = RULES["syn_flood"]
    if not rule["enabled"] or flags != "S":
        return
    tw = rule["time_window_seconds"]
    history = _syn_history[source_ip]
    history.append((time.time(), "SYN"))
    _cleanup(history, tw)
    if len(history) >= rule["packet_threshold"]:
        _save_alert("ALTO", "SYN_FLOOD", source_ip, f"{len(history)} paquetes SYN en {tw}s")
        history.clear()


def _detect_brute_force(source_ip: str, dport: int) -> None:
    rule = RULES["brute_force"]
    if not rule["enabled"]:
        return
    service = next((name for name, port in rule["ports"].items() if dport == port), None)
    if not service:
        return
    tw = rule["time_window_seconds"]
    key = (source_ip, service)
    history = _brute_force_history[key]
    history.append((time.time(), dport))
    _cleanup(history, tw)
    if len(history) >= rule["attempt_threshold"]:
        _save_alert("ALTO", f"FUERZA_BRUTA_{service}", source_ip, f"{len(history)} intentos hacia {service} puerto {dport} en {tw}s")
        history.clear()


def _detect_connection_frequency(source_ip: str) -> None:
    rule = RULES["connection_frequency"]
    if not rule["enabled"]:
        return
    tw = rule["time_window_seconds"]
    history = _connection_frequency_history[source_ip]
    history.append((time.time(), "TCP"))
    _cleanup(history, tw)
    if len(history) >= rule["packet_threshold"]:
        _save_alert("MEDIO", "ALTA_FRECUENCIA_CONEXIONES", source_ip, f"{len(history)} conexiones TCP en {tw}s")
        history.clear()


def _detect_suspicious_port(source_ip: str, dport: int) -> None:
    rule = RULES["suspicious_ports"]
    if not rule["enabled"]:
        return
    if dport in set(rule["ports"]):
        _save_alert("BAJO", "PUERTO_SOSPECHOSO", source_ip, f"Conexion hacia puerto sensible {dport}")


def _detect_rare_port(source_ip: str, dport: int) -> None:
    rule = RULES["rare_ports"]
    if not rule["enabled"]:
        return
    if dport in set(rule["ports"]):
        _save_alert("MEDIO", "PUERTO_RARO", source_ip, f"Conexion hacia puerto raro {dport}")


def start_ids_worker() -> None:
    try:
        from scapy.all import sniff  # noqa: PLC0415
        sniff(prn=_on_packet, store=False)
    except Exception as exc:
        print(f"[AEGIS-IDS] Worker no iniciado (requiere privilegios de administrador): {exc}")
