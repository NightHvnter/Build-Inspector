import json
import os
from pathlib import Path

import pymysql


def read_env():
    # Le credenziali arrivano dalle variabili d'ambiente o dal file .env nella root del progetto.
    env = {}
    path = Path(__file__).resolve().parent.parent / ".env"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")
    env.update(os.environ)
    if not env.get("MYSQL_ROOT_PASSWORD"):
        raise SystemExit("Imposta MYSQL_ROOT_PASSWORD nel file .env (vedi .env.example).")
    return env

def load_to_mariadb():
    # 1. Legge il file JSON pulito
    with open("hardware_data_clean.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Connessione a MariaDB (Docker)
    env = read_env()
    connection = pymysql.connect(
        host=env.get("MYSQL_HOST", "localhost"),
        user="root",
        password=env["MYSQL_ROOT_PASSWORD"],
        database=env.get("MYSQL_DATABASE", "build_inspector"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with connection.cursor() as cursor:
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Cpu (
                    Id INT auto_increment primary key,
                    Name VARCHAR(100),
                    Cores SMALLINT,
                    Mark INT,
                    Socket VARCHAR(20)
                )      
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Gpu (
                    Id INT auto_increment primary key,
                    Name VARCHAR(100),
                    Mark INT
                )      
            """)

            cursor.execute("""
                DELETE FROM Cpu
            """)

            cursor.execute("""
                DELETE FROM Gpu
            """)

            for cpu in data.get("cpu", []):
                newMark = str(cpu["mark"]).replace(",", "")

                cursor.execute("""
                    INSERT INTO Cpu (Name, Cores, Mark, Socket)
                    VALUES (%s, %s, %s, %s)
                """, (
                    cpu.get("name"),
                    int(cpu["cores"]) if cpu.get("cores") and str(cpu["cores"]).isdigit() else None,
                    int(newMark) if cpu.get("mark") and newMark.isdigit() else 0,
                    cpu.get("socket") if cpu.get("socket") != "Unknown" else None
                ))

            for gpu in data.get("gpu", []):
                cursor.execute("""
                    INSERT INTO Gpu (name, mark)
                    VALUES (%s, %s)
                """, (
                    gpu.get("name"),
                    int(gpu["mark"]) if gpu.get("mark") and str(gpu["mark"]).isdigit() else 0
                ))

            connection.commit()
            print("Dati caricati con successo nel database MariaDB!")
    finally:
        connection.close()

if __name__ == "__main__":
    load_to_mariadb()