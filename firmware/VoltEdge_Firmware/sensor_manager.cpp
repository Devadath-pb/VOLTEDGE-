#include <Wire.h>
#include <math.h>
#include <Adafruit_INA219.h>

#include "config.h"
#include "sensor_manager.h"
#include "relay_manager.h"

Adafruit_INA219 ina219;

static float runningSoc = NAN;
static float previousSignedCurrentMa = 0.0f;
static unsigned long previousSocTimestamp = 0;

String detectBatteryMode(float currentMa)
{
    if (!isfinite(currentMa))
        return "IDLE";

    const float normalizedCurrentMa = currentMa * CURRENT_DIRECTION_SIGN;
    if (normalizedCurrentMa > CURRENT_MODE_DEADBAND_MA)
        return "CHARGING";
    if (normalizedCurrentMa < -CURRENT_MODE_DEADBAND_MA)
        return "DISCHARGING";
    return "IDLE";
}

float estimateStateOfCharge(float voltage)
{
    if (isnan(voltage))
        return NAN;

    const float span = SOC_FULL_VOLTAGE - SOC_EMPTY_VOLTAGE;
    if (span <= 0.0f)
        return NAN;

    float percentage = ((voltage - SOC_EMPTY_VOLTAGE) / span) * 100.0f;
    if (percentage < 0.0f)
        percentage = 0.0f;
    if (percentage > 100.0f)
        percentage = 100.0f;

    return percentage;
}

static float signedCurrentForMode(float currentMa, const String& mode)
{
    const float magnitude = fabs(currentMa * CURRENT_DIRECTION_SIGN);
    if (mode == "CHARGING")
        return magnitude;
    if (mode == "DISCHARGING")
        return -magnitude;
    return 0.0f;
}

void updateStateOfCharge(BatteryData& data, float ratedCapacityMah)
{
    const float capacityMah = ratedCapacityMah > 0.0f
        ? ratedCapacityMah
        : SOC_DEFAULT_CAPACITY_MAH;
    const float voltageSoc = estimateStateOfCharge(data.voltage);

    if (isnan(runningSoc) || previousSocTimestamp == 0)
    {
        runningSoc = voltageSoc;
    }
    else
    {
        const unsigned long elapsedMs = data.timestamp - previousSocTimestamp;
        const float elapsedSeconds = elapsedMs / 1000.0f;
        if (elapsedSeconds <= 0.0f || elapsedSeconds > SOC_MAX_INTEGRATION_GAP_SECONDS)
        {
            // Re-anchor after a long disconnect/reboot gap instead of integrating
            // an unknown amount of current.
            runningSoc = voltageSoc;
        }
        else
        {
            const float currentSignedMa = signedCurrentForMode(data.current, data.mode);
            const float averageCurrentMa = (previousSignedCurrentMa + currentSignedMa) / 2.0f;
            const float deltaPercentage = averageCurrentMa * elapsedSeconds / (capacityMah * 36.0f);
            runningSoc += deltaPercentage;
            if (runningSoc < 0.0f)
                runningSoc = 0.0f;
            if (runningSoc > 100.0f)
                runningSoc = 100.0f;
        }
    }

    previousSignedCurrentMa = signedCurrentForMode(data.current, data.mode);
    previousSocTimestamp = data.timestamp;
    data.soc = runningSoc;
}

bool sensorInit()
{
    Wire.begin(SDA_PIN, SCL_PIN);
    pinMode(THERMISTOR_PIN, INPUT);

    return ina219.begin();
}

float readTemperature()
{
    const float SERIES_RESISTOR = 10000.0;
    const float NOMINAL_RESISTANCE = 10000.0;
    const float NOMINAL_TEMPERATURE = 25.0;
    const float BETA = 3950.0;

    int adc = analogRead(THERMISTOR_PIN);

    Serial.print("TEMP ADC: ");
    Serial.println(adc);
    if (adc <= 0 || adc >= 4095)
        return NAN;

    float resistance = SERIES_RESISTOR * (adc / (4095.0 - adc));

    float steinhart = resistance / NOMINAL_RESISTANCE;
    steinhart = log(steinhart);
    steinhart /= BETA;
    steinhart += 1.0 / (NOMINAL_TEMPERATURE + 273.15);
    steinhart = 1.0 / steinhart;
    steinhart -= 273.15;


    return steinhart;
}

BatteryData readBattery()
{
    BatteryData data;

    data.voltage = ina219.getBusVoltage_V();
    data.current = ina219.getCurrent_mA();
    data.power = ina219.getPower_mW();
    data.soc = estimateStateOfCharge(data.voltage);

    data.temperature = readTemperature();

    data.relay = isDischarging();
    // Mode is derived from the measured current direction, not from the relay
    // or button state. This keeps telemetry truthful when an external charger
    // or load is connected while the relay is off.
    data.mode = detectBatteryMode(data.current);

    data.timestamp = millis();

    return data;
}
