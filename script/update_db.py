import json
import pymysql

def load_to_mariadb():
    # 1. Legge il file JSON pulito
    with open("hardware_data_clean.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Connessione a MariaDB (Docker)
    connection = pymysql.connect(
        host="localhost",
        user="app_user",
        password="app_password",  # Sostituisci con la tua password
        database="mio_database",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with connection.cursor() as cursor:

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