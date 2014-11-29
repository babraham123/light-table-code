#include "FastSPI_LED2.h"

// Move a white dot along the strip of leds.  This program simply shows how to configure the leds,
// and then how to turn a single pixel white and then off, moving down the line of pixels.

#define NUM_LEDS 104
#define DATA_PIN 6
CRGB leds[NUM_LEDS];

void setup() {
  delay(2000);
  FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
}

void loop() {
  for(int whiteLed = 0; whiteLed < NUM_LEDS; whiteLed = whiteLed + 1) 
  {
    leds[whiteLed] = CRGB::White;
    FastLED.show();
    delay(200);
    leds[whiteLed] = CRGB::Black;
  }
}
