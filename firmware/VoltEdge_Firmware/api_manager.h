#ifndef API_MANAGER_H
#define API_MANAGER_H

#include "models.h"

bool apiInit();

bool sendBatteryData(const BatteryData& data);

bool getActiveBattery(String& batteryIdOut, float& ratedCapacityOut, float& cutoffVoltageOut);

bool startCycle(const String& batteryId, String& cycleIdOut);

bool toggleCyclePhase(const String& phase);

bool stopCycle();

bool stopSession();

#endif