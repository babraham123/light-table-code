/***
Arduino controller script for a interactive, light up table.

Author: Bereket Abraham
***/

#include "FastSPI_LED2.h"

#define STATUS_PIN 3
#define NUM_LEDS 50
#define DATA_PIN 6
CRGB leds[NUM_LEDS];

int index1, index2, red, green, blue;
#define DEBUG false

void setup() {
    Serial.begin(9600);
    index1 = 0;
    index2 = 0;
    red = 0;
    green = 0;
    blue = 0;

    // Set the LED controller
    delay(1000);
    FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
    blackout();
    if(DEBUG) { Serial.println("Lights engaged"); }

    // Set the status light
    pinMode(STATUS_PIN, OUTPUT);

}

void loop() {
    // 2 bytes for the index, 3 for the color
    if ( Serial.available() >= 5 )  {
        index1 = Serial.read();
        index2 = Serial.read();
        red = Serial.read();
        green = Serial.read();
        blue = Serial.read();

        // combine index bytes
        unsigned int index = ((unsigned int)index1 << 8) + (unsigned int)index2;
        // RGB, 0xFFAACC, 3 bytes
        unsigned long hexcolor = ((unsigned long)red << 16) + ((unsigned long)green << 8) + (unsigned long)blue;

        setColor(index, hexcolor);
    }

    //FastLED.show();
}


void setColor(unsigned int index, unsigned long hexcolor) {
    // Accepts the LED index (int) and the 3 byte color # (unsigned long)
    
    //leds[index] = CRGB::White;
    leds[index] = hexcolor;
    FastLED.show();

    if(DEBUG) { 
        Serial.print("Color " + String(index) + " : ");
        Serial.println(hexcolor, HEX); 
    }
}

void blackout() {
    for(int i = 0; i < NUM_LEDS; i++) 
    { leds[i] = CRGB::Black; }

    FastLED.show();
    delay(2000);
}
void loop_lights() {
  // Move a single white led 
    for(int whiteLed = 0; whiteLed < NUM_LEDS; whiteLed++) {
        leds[whiteLed] = CRGB::White;
        // Show the leds (only one of which is set to white, from above)
        FastLED.show();

        delay(200);
        leds[whiteLed] = CRGB::Black;
    }
}
