#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

bool wifiConnect();

void wifiLoop();

bool wifiConnected();

String getIPAddress();

#endif