/***
Arduino controller script for a interactive, light up table.
Author: Bereket Abraham
***/
#include "FastSPI_LED2.h"

// col 13, row 8
#define NUM_LEDS 105
#define NUM_COL 13
#define NUM_ROW 8
#define DATA_PIN 6
#define STATUS_PIN 3
#define BUFFER_SIZE 10
#define ESCAPE 'X'
#define DEBUG false

CRGB leds[NUM_LEDS];
char serialBuffer[BUFFER_SIZE];
int currIndex = 0;

void clearBuffer() {
    for(int i = 0; i < BUFFER_SIZE; i++) 
    {
        serialBuffer[i] = ESCAPE;
    }
    currIndex = 0;
}

unsigned int convertCharHex(char a, char b) {
    // converts two chars in hex format into one unsigned int
    // 'F','F' => 255
    unsigned int x = 0;
    unsigned int y = 0;
    if(a >= '0' && a <= '9') { x = a - '0'; }
    else if(a >= 'A' && a <= 'F') { x = a - 'A' + 10; }
    else if(a >= 'a' && a <= 'f') { x = a - 'a' + 10; }
    
    if(b >= '0' && b <= '9') { y = b - '0'; }
    else if(b >= 'A' && b <= 'F') { y = b - 'A' + 10; }
    else if(b >= 'a' && b <= 'f') { y = b - 'a' + 10; }
    
    return (x << 4) + y;
}

void setColor(unsigned int index, unsigned int r, 
        unsigned int g, unsigned int b) {
    // Accepts the LED index and the 3 byte color
    
    leds[index].setRGB(r, g, b);
    FastLED.show();

    if(DEBUG) {
        Serial.print(String(index) + " : ");
        Serial.print(r, HEX);
        Serial.print(g, HEX);
        Serial.println(b, HEX);
        Serial.flush();
    }
}

unsigned int mapIndex(unsigned int index) {
    // map the row,col indexing to the layout of
    // the actual LED string
    index = index % NUM_LEDS;
    // assuming a zigzag orientation
    int row = index / NUM_COL;
    int col = index % NUM_ROW;
    if((row % 2) != 0) {
      // invert the row if odd 
      index = index - ((col*2) - NUM_COL + 1);
    }
    return index;
}

void blackout() {
    for(int i = 0; i < NUM_LEDS; i++)
    { leds[i] = CRGB::Black; }
    FastLED.show();
    delay(500);
}
void loop_lights() {
    // Move a single white led
    unsigned int whiteLed = 0;
    for(unsigned int i = 0; i < NUM_LEDS; i++) {
        whiteLed = mapIndex(i);
        //whiteLed = i;
        leds[whiteLed] = CRGB::White;
        FastLED.show();
        delay(30);
        leds[whiteLed] = CRGB::Black;
    }
}

void readFromBuffer() {
    if(Serial.available() > 0) {
        char val = Serial.read();
        if(val == ESCAPE) {
            unsigned int index = (currIndex + BUFFER_SIZE - 9) % BUFFER_SIZE;
            unsigned int r = (currIndex + BUFFER_SIZE - 6) % BUFFER_SIZE;
            unsigned int g = (currIndex + BUFFER_SIZE - 4) % BUFFER_SIZE;
            unsigned int b = (currIndex + BUFFER_SIZE - 2) % BUFFER_SIZE;
            
            // check for short strings
            if(serialBuffer[index] == ESCAPE) {
                clearBuffer();
                return;
            }
            // combine index chars (3)
            index = ((serialBuffer[index] - '0') * 100) + 
                                 ((serialBuffer[(index+1) % BUFFER_SIZE] - '0') * 10) + 
                                 (serialBuffer[(index+2) % BUFFER_SIZE] - '0'); 
            index = mapIndex(index);
            // get the RGB color, 0xFFAACC (6)
            r = convertCharHex(serialBuffer[r], serialBuffer[(r+1) % BUFFER_SIZE]);
            g = convertCharHex(serialBuffer[g], serialBuffer[(g+1) % BUFFER_SIZE]);
            b = convertCharHex(serialBuffer[b], serialBuffer[(b+1) % BUFFER_SIZE]);
            
            setColor(index, r, g, b);
            clearBuffer();
        } else {
            serialBuffer[currIndex] = val;
            currIndex = (currIndex + 1) % BUFFER_SIZE;
        }
    }
}

void setup() {
    Serial.begin(9600);
    clearBuffer();
    if(DEBUG) {
        Serial.println("Starting...");
    }

    // Set the LED controller
    delay(1000);
    FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
    blackout();
    if(DEBUG) { 
        Serial.println("Lights engaged"); 
        loop_lights();
        blackout();
    }

    // Set the status light
    pinMode(STATUS_PIN, OUTPUT);
}

void loop() {
    readFromBuffer();
}

