# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React with Vite, JavaScript, Tailwind CSS, Recharts, Lucide React, React Router DOM, Axios, WebSocket, and Framer Motion.

## Users

Battery owners and operators who monitor live battery behavior, review SOH predictions, and decide whether used batteries are suitable for second-life applications.

## Product Purpose

Voltedge collects live ESP32 battery readings, stores them in Supabase, presents real-time monitoring and historical analysis, predicts SOH using the user's trained model, and recommends possible reuse applications.

## Capabilities and Constraints

- Six primary routes: Home, Dashboard, Analytics, Reuse, History, and Settings.
- No dataset-upload workflow; readings originate from a physical battery and ESP32 device.
- Live readings, predictions, and recommendations must distinguish real data from demo data.
- User data is isolated through Supabase Auth and Row Level Security.
- Each ESP32 device will use a distinct restricted device key.
- Reuse recommendations must not claim safety from SOH alone and must identify missing safety measurements.
- The user's SOH model will be supplied later as a `.pkl` artifact and integrated server-side.

## Brand Commitments

The product name is Voltedge. The visual direction is premium white-and-green glassmorphism with restrained motion, strong readability, and a commercial SaaS feel.

## Evidence on Hand

The existing frontend scaffold contains the six requested pages, reusable components, charts, hooks, API services, and demo data. Live Supabase data and the final SOH/reuse model are not yet connected.

## Product Principles

- Show real battery state clearly and honestly.
- Keep live monitoring, SOH prediction, and reuse decisions central.
- Make uncertainty and missing safety data visible.
- Preserve strict per-user and per-device data isolation.
- Prefer calm, readable operation over decorative complexity.
