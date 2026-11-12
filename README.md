# ⚡ VoltEdge

**AI-Powered Battery Lifecycle Intelligence Platform**

VoltEdge is an intelligent battery monitoring and predictive analytics platform designed to monitor battery performance, collect telemetry data, analyze battery health using AI, and generate diagnostic reports. The project combines IoT hardware, FastAPI, PostgreSQL, and Machine Learning to provide real-time battery lifecycle management.

---

# 🚀 Features

- Battery Registration & Management
- Live Battery Telemetry
- AI-Based State of Health (SoH) Prediction
- Remaining Useful Life (RUL) Estimation
- Battery Diagnostics
- Performance Reports
- Interactive Dashboard
- ESP32 Integration

### ESP32 OTA updates

The ESP32-C3 firmware supports password-protected OTA updates over the same
local Wi-Fi network after the first USB flash. The device advertises a
hostname such as `voltedge-A1B2C3` in Arduino IDE's network ports. OTA uses the
per-device `DEVICE_KEY` by default; define `VOLTEDGE_OTA_PASSWORD` in the local
ignored `secrets.h` if a separate password is preferred. Do not expose
ArduinoOTA directly to the public internet.
- PostgreSQL Database
- REST API using FastAPI

---

# 🏗️ Architecture

```
ESP32 Sensors
      │
      ▼
 FastAPI Backend
      │
      ▼
 PostgreSQL Database
      │
      ▼
 AI Prediction Engine
      │
      ▼
 Dashboard
```

---

# 🛠️ Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic

### AI & Data

- TensorFlow
- Scikit-Learn
- Pandas
- NumPy

### Dashboard

- Streamlit
- Plotly

### Hardware

- ESP32
- INA219 Current Sensor
- DS18B20 Temperature Sensor
- ZB2L3 Battery Capacity Tester

---

# 📂 Project Structure

```
VoltEdge/
│
├── ai/
├── backend/
├── dashboard/
├── database/
├── datasets/
├── docs/
├── firmware/
├── images/
├── reports/
├── tests/
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

# 🎯 Project Roadmap

## Phase 1

- Project Setup
- Database Design
- FastAPI Backend
- Battery Management

## Phase 2

- Telemetry Collection
- Dashboard

## Phase 3

- ESP32 Integration

## Phase 4

- AI Prediction Models

## Phase 5

- Report Generation
- Predictive Maintenance

---

# 📌 Current Status

🚧 Active Development

Current Progress:

- ✅ Project Structure
- ✅ Git Repository
- ✅ PostgreSQL Integration
- ✅ SQLAlchemy Models
- ✅ FastAPI Backend
- 🔄 Battery Management API

---

# 👨‍💻 Developer

**Devadath P B**

Bachelor of Computer Applications (BCA)

---

# 📄 License

This project is currently under active development.
License will be added before public release.
