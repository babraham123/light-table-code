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
#define BUFFER_SIZE 15
#define START_CHAR '^'
#define END_CHAR '\n'
#define DEBUG false

CRGB leds[NUM_LEDS];
char serialBuffer[BUFFER_SIZE];
int currIndex = 0;

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

// '^001:AA44FF\n'
void readFromBuffer() {
    char val = Serial.read();
    if (val == START_CHAR) {
        currIndex = 0;
    } else if (val == END_CHAR) {
        // check for short strings
        if(currIndex != 9) {
            currIndex = 0;
            return;
        }
        // combine index chars
        unsigned int index = ((serialBuffer[0] - '0') * 100) + 
                 ((serialBuffer[1] - '0') * 10) + 
                 (serialBuffer[2] - '0'); 
        index = mapIndex(index);
        // get the RGB color, 0xFFAACC
        unsigned int r = convertCharHex(serialBuffer[4], serialBuffer[5]);
        unsigned int g = convertCharHex(serialBuffer[6], serialBuffer[7]);
        unsigned int b = convertCharHex(serialBuffer[8], serialBuffer[9]);
        
        setColor(index, r, g, b);
    } else {
        serialBuffer[currIndex] = val;
        currIndex = (currIndex + 1) % BUFFER_SIZE;
    }
}

void setup() {
    for(int i = 0; i < BUFFER_SIZE; i++) {
        serialBuffer[i] = END_CHAR;
    }
    currIndex = 0;

    Serial.begin(9600);
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
    if(Serial.available() > 0) {
        readFromBuffer();
    }
}

