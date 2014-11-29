/***
Arduino controller script for a interactive, light up table.
Author: Bereket Abraham
***/
#include "FastSPI_LED2.h"

// col 13, row 8
#define NUM_LEDS 104
#define COL_SIZE 13
#define ROW_SIZE 8
#define DATA_PIN 6
#define STATUS_PIN 3
#define BUFFER_SIZE 5
#define DEBUG false

CRGB leds[NUM_LEDS];
int serialBuffer[] = {0,0,0,0,0};
int currIndex = 0;

void setColor(unsigned int index, unsigned long hexcolor) {
    // Accepts the LED index (int) and the 3 byte color # (unsigned long)
    leds[index] = hexcolor;
    FastLED.show();

    if(DEBUG) {
        Serial.print("Color " + String(index) + " : ");
        Serial.println(hexcolor, HEX);
    }
}

unsigned int mapIndex(unsigned int index) {
    // map the row,col indexing to the layout of
    // the actual LED string
    // assuming a zigzag orientation
    int row = index / ROW_SIZE;
    int col = index % COL_SIZE;
    if((row % 2) == 0) {
      // invert the row if even 
      index = index - ((col*2) - COL_SIZE + 1);
    }
    return index;
}

void blackout() {
    for(int i = 0; i < NUM_LEDS; i++)
    { leds[i] = CRGB::Black; }
    
    FastLED.show();
    delay(2000);
}
void loop_lights() {
  // Move a single white led
    for(unsigned int ind = 0; ind < NUM_LEDS; ind++) {
        unsigned int whiteLed = mapIndex(ind);
        leds[whiteLed] = CRGB::White;
        // Show the leds (only one of which is set to white, from above)
        FastLED.show();
        delay(200);
        leds[whiteLed] = CRGB::Black;
    }
}

void setup() {
    Serial.begin(9600);
    // Set the LED controller
    delay(1000);
    FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
    blackout();
    if(DEBUG) { 
        Serial.println("Lights engaged"); 
        loop_lights();
    }

    // Set the status light
    pinMode(STATUS_PIN, OUTPUT);
}

void loop() {
    // TODO: create a circular buffer to hold values + end value
    /*
    while(Serial.available() > 0) {
        int val = Serial.read();
        if(val == ESCPAPE) {
            int ind1 = (currIndex + BUFFER_SIZE - 5) % BUFFER_SIZE;
            int ind2 = (currIndex + BUFFER_SIZE - 4) % BUFFER_SIZE;
            int r = (currIndex + BUFFER_SIZE - 3) % BUFFER_SIZE;
            int g = (currIndex + BUFFER_SIZE - 2) % BUFFER_SIZE;
            int b = (currIndex + BUFFER_SIZE - 1) % BUFFER_SIZE;
            // combine index bytes
            unsigned int index = ((unsigned int)serialBuffer[ind1] << 8) + 
                                  (unsigned int)serialBuffer[ind2];
            index = mapIndex(index);
            // RGB, 0xFFAACC, 3 bytes
            unsigned long hexcolor = ((unsigned long)serialBuffer[r] << 16) + 
                                     ((unsigned long)serialBuffer[g] << 8) + 
                                     (unsigned long)serialBuffer[b];
            setColor(index, hexcolor);
        } else {
            serialBuffer[currIndex] = val;
            currIndex = (currIndex + 1) % BUFFER_SIZE;
        }
    }
    */
    // 2 bytes for the index, 3 for the color
    if ( Serial.available() >= 5 )  {
        int index1 = Serial.read();
        int index2 = Serial.read();
        int red = Serial.read();
        int green = Serial.read();
        int blue = Serial.read();

        // combine index bytes
        unsigned int index = ((unsigned int)index1 << 8) + (unsigned int)index2;
        index = mapIndex(index);
        // RGB, 0xFFAACC, 3 bytes
        unsigned long hexcolor = ((unsigned long)red << 16) + ((unsigned long)green << 8) + (unsigned long)blue;

        setColor(index, hexcolor);
    }
}

