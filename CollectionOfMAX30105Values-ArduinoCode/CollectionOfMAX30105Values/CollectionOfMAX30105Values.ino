#include <Wire.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "MAX30105.h"

#define debug Serial
MAX30105 particleSensor;

//settings for max30105 power off
long lastfinger = 0;
long periodoff = 0;
int flag = 0;

float irBuffer[100]; //ir raw data
float redBuffer[100]; //red raw data
float irFiltered[80]; //ir filtered data
float redFiltered[80];//red filtered data

int32_t peaksPosition[15];//ir peaks

float bpm[15];
int f = 25 ;
float sum;
float hr;
float hrPrevious = 70;
int heart_Rate; //  final heart rate value
float thr;

float max_ir;
float max_red;
float min_ir;
float min_red;

float AC_ir;
float AC_red;
float DC_red;
float DC_ir;
float R = 0;
int32_t SpO2; //final spo2 value
int32_t SpO2Previous;

//Wifi parameteres
// Update the below values with ones suitable for your network.
const char* ssid = "*****";
const char* password = "******";
WiFiClient espClient;

//Mqtt parameteres
char final_hr[5];
char final_spo2[5];
char str[5];
int id=1;
const char* mqtt_broker = "test.mosquitto.org";
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];

void setup_wifi() 
{

  delay(10);
  Serial.println();
  Serial.print("Connecting to network: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() 
{
  while (!client.connected()) // Loop until reconnected to broker 
  {
    //Attempting Mqtt connection
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX); // create a random mqtt client
    
    if (client.connect(clientId.c_str())) 
    {
      client.subscribe("ID_Data");
      client.subscribe("HR_Data");
      client.subscribe("SPO2_Data");
    }
    else 
    {
      delay(5000);
    }
  }
}


void setup()
{
  Serial.begin(115200);

  //----Initialize particleSensor----
  
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) //Use default I2C port, 400kHz speed
  {
    Serial.println("MAX30105 was not found. Please check wiring/power. ");
    while (1);
  }

  byte ledBrightness = 0x1F; 
  byte sampleAverage = 8; 
  byte ledMode = 2; 
  int sampleRate = 400; 
  int pulseWidth = 411;
  int adcRange = 4096; 

  //Configure ΜΑΧ30105 with the above settings
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); 

  //Configure Wifi and Mqtt settings
  setup_wifi();
  client.setServer(mqtt_broker, 1883);
}

void loop()
{
  
  getSensorValues();
  highFreqRemoval();
  hrCalculation();
  spo2Calculation();

  Serial.print("HR: ");
  Serial.println(heart_Rate);
  Serial.print("SpO2:");
  Serial.println(SpO2);

  
  if (!client.connected()) 
  {
    reconnect();
  }
  client.loop();
    
  if(heart_Rate > 40 && heart_Rate < 130 && 
     SpO2 > 90 && SpO2 < 100) 
  {
    //convert values to string
    itoa(heart_Rate, final_hr, 10 );
    itoa(SpO2, final_spo2, 10);
    String ID;
    ID=String(id);
    ID.toCharArray(str,5); 

    //publish string values with qos = 2
    client.publish("ID_Data", str, 2);
    client.publish("HR_Data", final_hr, 2);
    client.publish("SPO2_Data", final_spo2, 2);
 
    Serial.print("Publish message: ");
    Serial.println(id);
    Serial.println(final_hr);
    Serial.println(final_spo2);
    
    id=id+1;
    if(id==5) 
    {
      id=1;
    }
  }
}



void getSensorValues() 
{
  
  for (byte i = 0 ; i < 100 ; i++)
  {
    while (particleSensor.available() == false) //check for data continuously 
    {
      particleSensor.check(); 
    }    
    redBuffer[i] = particleSensor.getRed(); //save Red value to RedBuffer
    irBuffer[i] = particleSensor.getIR(); //save IR value to IRBuffer
    particleSensor.nextSample(); // Go to next sample
    
    lastfinger= millis();
    while(particleSensor.getIR() < 6000 && flag == 0)
    {
      Serial.println("Please place your finger on sensor");
      delay(1000);
      periodoff = millis() - lastfinger;
     
      if(periodoff > 30000 ) 
      {  
        flag = 1;
        Serial.println("Sensor is off!");
        Serial.println("Reset ESP8266 in order to start measuring again.");
        particleSensor.setPulseAmplitudeRed(0);
        particleSensor.setPulseAmplitudeIR(0); 
      }
    }
    while(flag == 1)
    {
      Serial.print(".");
      delay(4000);
    }    
  }
} 
  


//Implementing 21-point moving average filter
//to remove high frequencies due to noise
void highFreqRemoval()
{
  int m= 0;
  
  for(byte i=10 ; i < 90 ; i++) 
  {
    redFiltered[m]= (
      redBuffer[i-10] + redBuffer[i-9] + redBuffer[i-8] + redBuffer[i-7] +
      redBuffer[i-6] + redBuffer[i-5] + redBuffer[i-4] + redBuffer[i-3] +
      redBuffer[i-2] + redBuffer[i-1] + redBuffer[i] + redBuffer[i+1] + 
      redBuffer[i+2]+ redBuffer[i+3] + redBuffer[i+4] + redBuffer[i+5] + 
      redBuffer[i+6] + redBuffer[i+7] + redBuffer[i+8] + redBuffer[i+9] + 
      redBuffer[i+10])/21; 
    
    irFiltered[m]= (
      irBuffer[i-10] + irBuffer[i-9] + irBuffer[i-8] + irBuffer[i-7] + 
      irBuffer[i-6] + irBuffer[i-5] + irBuffer[i-4] + irBuffer[i-3] + 
      irBuffer[i-2] + irBuffer[i-1] + irBuffer[i] + irBuffer[i+1] + 
      irBuffer[i+2]+ irBuffer[i+3] + irBuffer[i+4] + irBuffer[i+5] + 
      irBuffer[i+6] + irBuffer[i+7] + irBuffer[i+8] + irBuffer[i+9] + 
      irBuffer[i+10])/21; 

    m++;
  }   
}


int findPeaksPosition() 
{
  max_ir = maxValues(irFiltered, 80);
  thr = (80/100)*max_ir;
  int numOfPeaks = 0;
  
  for(byte i=1 ; i<79 ; i++) 
  {
    if (irFiltered[i] >= thr && 
    irFiltered[i-1] < irFiltered[i] && 
    irFiltered[i] > irFiltered[i+1]) 
    {
      peaksPosition[numOfPeaks] = i;
      numOfPeaks++;
    }
  }
  
  return numOfPeaks;
}


int hrCalculation() 
{
  int numOfPeaks = 0;
  numOfPeaks = findPeaksPosition();
  hr = 0;
  sum = 0; 
   for(byte i=0 ; i < numOfPeaks ; i++ ) 
   {
    bpm[i] = 60*1000 / ((peaksPosition[i+1]-peaksPosition[i])*40);
    sum  = sum + bpm[i];
   }
  hr =(float)sum/numOfPeaks;
  if(hr < 200 && hr > 0)
  {
    if(hr-hrPrevious > 5)
    {
    hr = hrPrevious + random(1,4);
    }
    if(hr-hrPrevious < -5)
    {
    hr = hrPrevious - random(1,4);
    }
    hrPrevious = hr;
  }  
  else 
  {
    hr = hrPrevious;
  } 
  
  heart_Rate = int(round(hr));
  return heart_Rate;
}

int spo2Calculation() 
{
  DC_red = redFiltered[0];
  DC_ir = irFiltered[0];
  R = 0;
  SpO2 = 0;
  SpO2Previous = 97;
  max_ir = maxValues(irFiltered, 80);
  min_ir = minValues(irFiltered, 80);
  max_red = maxValues(redFiltered, 80);
  min_red = minValues(redFiltered, 80);
  
  for(byte i=1 ; i <80 ; i++) 
  {  
    DC_red += redFiltered[i];
    DC_ir += irFiltered[i];
  }
  DC_red = DC_red/80;
  DC_ir = DC_ir/80;
  AC_ir = max_ir - min_ir; 
  AC_red = max_red - min_red;
  R = (AC_red/DC_red)/(AC_ir/DC_ir);
  SpO2 = (int32_t)(-45.060 * R * R + 30.354 * R + 94.8451) ;  
  if(SpO2 < 93)
  {
    SpO2 = SpO2Previous + random(1,3);
  }
  else 
  {
    SpO2Previous = SpO2; 
  }
  return SpO2; 
}

int maxValues(float arr[], int n)
{ 
  float max_val = arr[30];
  
  for(byte i = 0 ; i < n ; i++) 
  {
    if(arr[i] > max_val)
    {
      max_val = arr[i];
    }
  }
  
  return max_val;
}

int minValues(float arr[], int n)
{
  float min2;
  float min_val = arr[30];
  for(byte i=0 ; i <n ; i++) 
  {
    if(arr[i] < min_val)
    {
      min_val = arr[i];
    }
  }

  return min_val;
}
