#include <Wire.h>
#include <math.h>
#include <Adafruit_INA219.h>

#include "config.h"
#include "sensor_manager.h"
#include "relay_manager.h"

Adafruit_INA219 ina219;

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
    data.mode = getMode();

    data.timestamp = millis();

    return data;
}
