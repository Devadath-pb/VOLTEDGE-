#pragma once

// Starts and services password-protected OTA updates over the local Wi-Fi
// network. The device key is used as the fallback OTA password unless an
// optional VOLTEDGE_OTA_PASSWORD macro is defined in secrets.h.
void otaInit();
void otaLoop();
