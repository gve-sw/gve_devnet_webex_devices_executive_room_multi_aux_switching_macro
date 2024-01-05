/*
Copyright (c) 2021 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*
* Repository: gve_devnet_webex_devices_executive_room_multi_aux_switching_macro
* Macro file: main_codec
* Version: 1.0.17
* Released: January 5, 2024
* Latest RoomOS version tested: 11.11.1.9
*
* Macro Author:      	Gerardo Chaves
*                    	Technical Solutions Architect
*                    	gchaves@cisco.com
*                    	Cisco Systems
*
* Consulting Engineer: Robert(Bobby) McGonigle Jr
*                    	 Technical Marketing Engineer
*                    	 bomcgoni@cisco.com
*                    	 Cisco Systems
* 
*    
* 
*    As a macro, the features and functions of this webex devices executive room voice activated 
*    switching macro are not supported by Cisco TAC
* 
*    Hardware and Software support are provided by their respective manufacturers 
*      and the service agreements they offer
*    
*    Should you need assistance with this macro, reach out to your Cisco sales representative
*    so they can engage the GVE DevNet team. 
*/
/////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS
/////////////////////////////////////////////////////////////////////////////////////////

import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//TODO: Test pause speakertrack with perma side by side mode since it originall would try to turn on ST


/////////////////////////////////////////////////////////////////////////////////////////
// INSTALLER SETTINGS
/////////////////////////////////////////////////////////////////////////////////////////


/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/


// AUX_CODEC_USERNAME and AUX_CODEC_PASSWORD are the username and password of a admin-level user on the Auxiliary codecs
// Here are instructions on how to configure local user accounts on Webex Devices:
// https://help.webex.com/en-us/jkhs20/Local-User-Administration-on-Room-and-Desk-Devices)
// If you wish to slightly obfuscate the credentials, use a Base64 encoded string for AUX_CODEC_USERNAME and
// leave AUX_CODEC_PASSWORD blank. If you do that, you would need to combine the username and password in one string
// separated by a colon (i.e. "username:password") before Base64 encoding with a tool such as https://www.base64encode.org/
const AUX_CODEC_USERNAME = 'username';
const AUX_CODEC_PASSWORD = 'password';



// Set USE_ST_BG_MODE to true if you want keep QuadCams Speaker Tracking even while not being used
const USE_ST_BG_MODE = true;

const CODEC_MAIN = 1, CODEC_AUX = 2, CODEC_NONE = 0


// CAMERA / MICROPHONE ZONE PRESET OBJECTS (Z1 - Z8)
// This section is used if you have one or two PTZ cameras (either Precision 60 or PTZ 4K),
// and you want to define up to 8 microphone zones that will be serviced by Pan Tilt Zoom cameras.
// This can be in combination with one or more Quad Cameras, or without any Quad Cameras.
// The maximum number of PTZ Microphone Zones is 8. If you have one Quad Camera, it will use one of your mic inputs,
// and if you have multiple Quad Cameras (using Aux codecs), they will use multiple mic inputs. This leaves you with 7 or less for PTZ cameras.
// FOR EACH PTZ MICROPHONE ZONE (UP TO 8) YOU MUST DEFINE AT LEAST A PRIMARY CAMERA PRESET ID.
// If you have two PTZ cameras, you can define a primary and a secondary camera for each microphone zone.
// The reason: if Camera "A" is in use already, you will want to use Camera "B" for the next shot,
// so that the far end does not see camera motion, which could be distracting/dizzying.
// WARNING: Do not delete Z0 even if you do not intend to use camera zones, it is needed to initialize the "last camera zone used" global.
// You can define as many camera preset objects as needed up to 8, using the ZN naming convention.
// If you do not have any PTZ cameras connected to the codec, simply leave Z1 and Z2 defined as below as examples but
// do not use them in your compositions
// NOTE: If you do not have a secondary preset for a zone, just use the same as the primary as the code needs that 'secondary' key present
const Z0 = { 'primary': 0, 'secondary': 0 } //DO NOT DELETE OR COMMENT ME!!!!!

const Z1 = { 'primary': 12, 'secondary': 12 } // These are ok to change
const Z2 = { 'primary': 15, 'secondary': 16 } // These are ok to change
const Z3 = { 'primary': 17, 'secondary': 18 } // These are ok to change
const Z4 = { 'primary': 0, 'secondary': 0 } // These are ok to change
const Z5 = { 'primary': 0, 'secondary': 0 } // These are ok to change
const Z6 = { 'primary': 0, 'secondary': 0 } // These are ok to change
const Z7 = { 'primary': 0, 'secondary': 0 } // These are ok to change
const Z8 = { 'primary': 0, 'secondary': 0 } // These are ok to change

/*
The config constant below contains general microphones and video sources and, alternatively, presetZones for both main
and  auxiliary codecs

The monitorMics, ethernetMics and usbMics arrays refer to locally connected microphones for which the macro will monitor vuMeter levels. 
    The ID range for monitorMics is 1-8 since it refers to the physical analog mic input connectors on the codec.
    The ID range for ethernetMics is 11-18, 21-28 an so forth until 81-88 since we support up to 8 ethernet mics with 8 
    sub-ids each. So, for example , ethernec mic ID 12 as specified in this array refers to Ethernet Mic 1, sub-ID 2
    The ID range for usbMics is 101-104 an maps to USB mic IDs 1-4 even though at the moment just one USB Mic input is supported (101)
    The externalMics array refers to externally connected microphones where a controller sends the codec text messages over SSH or 
    serial interface indicating which of those external microphones is currently active. 
    The text message should be sent by the controller in the format “MIC_ACTIVE_XX” where XX is a distinct 
    “microphone” id from 01 o 99. We are reserving 00 to indicate that there is relative silence in the room or that mute is active.
    Even though the receiving of unformatted “MIC_ACTIVE_XX” type strings is supported, for better logging it is strongly 
    recommended that the controller sends the message wrapped as an object as shown in the following examples. 
    sending the MIC_ACTIVE_01 message via serial: 
    xCommand Message Send Text: "{\x5C"App\x5C":\x5C"Crestron\x5C",\x5C"Source\x5C":{},\x5C"Type\x5C":\x5C"Command\x5C",\x5C"Value\x5C":\x5C"MIC_ACTIVE_01\x5C"}"\x0D\x0A  
    sending the MIC_ACTIVE_01 message via SSH:  
    xCommand Message Send Text: "{\"App\":\"Crestron\",\"Source\":{},\"Type\":\"Command\",\"Value\":\"MIC_ACTIVE_01\"}" 
    NOTE: Any combination of microphone types specified in the monitorMics, ethernetMics , usbMics and externalMics is supported by
    the macro, but given the differences in echo cancellation processing performed by the different microphone categories it is strongly
    advised to stick to only one type of microphone to use for each installation. 

The value for the 'compositions' key is an array of composition objects with values corresponding to the following keys:
- 'name' The name of the composition. This is just used as an internal reference in the macro and is printing in the console logs
- 'codecIP' is the IPv4 IP address of the Auxiliary codec that is the source that a particular composition will use.
and the 'source' field is set to CODEC_AUX.  The 'connectors' array for this composition should contain the ID of the 
connector of the tie line coming from that auxiliary codec into the main codec.
- 'mics' is the array of active microphones that are considered to switch to that particular composition. These could be analog (1-8), ethernet (11-14, 21-24, etc), usb (101) or external (901-999) microphones
- 'connectors' are the video connector IDs to use in conjunction with the 'layout' value to set the main video input
when any microphone in the 'mics' array is the most active. 
- 'source' should be set to CODEC_AUX if any of the video connectors in the 'connectors' array correspond to tie lines coming in
from an Auxiliary codec. If not, it should be set to CODEC_MAIN unless the composition corresponds to the Overview 
compositions where the 'mics' array is set to [0] in which case it should be set to CODEC_NONE
- 'layout' specified the Layout to use to arrange the input connectors specified in the 'connectors' array. 
This can be Prominent , Equal or PIP
- 'presetZone' is an optional field that can be used instead of the 'connectors' array to specify a preset "zone"
to use for that particular composition. If you leave  a 'presetZone'
key in the object but really intend to use the 'connectors' array, please set the value to Z0 to indicate it is not used
NOTE: There is an additional feature for the Overview composition where you can specify and array of camera preset IDs in 
as the value for hte 'presetZone' key if you wish to use presets in overview compositions. More details below
*/
const config = {
  monitorMics: [], // input connectors associated to the microphones being used in the main codec. Example: [1, 2, 3, 4, 5, 6, 7, 8]
  ethernetMics: [], // IDs associated to Ethernet mics: e.j. 12 is Ethernet Mic 1, sub-ID 2. Example:  [11, 12, 13, 14]
  usbMics: [], // Mic input connectors associated to the USB microphones being used in the main codec: 101 is USB Mic 1. Example: [101]
  externalMics: [], //  (ex: [901, 902]) input ids associated to microphones connected to an external controller received as message format MIC_ACTIVE_XX where XX is an external mic id 01-99
  compositions: [     // Create your array of compositions, not needed if codec is secondary 
    {
      name: 'RoomMain',     // Name for your composition
      codecIP: '',
      mics: [1, 2, 3],             // Mics you want to associate with this composition
      connectors: [1],    // Video input connector Ids to use
      source: CODEC_MAIN,
      layout: 'Prominent',       // Layout to use
      presetZone: Z0 // use a camera preset zone (Z1, Z2, Z3, etc..) instead of a layout with specific connectors.
    },
    {
      name: 'Aux1',     // Name for your composition
      codecIP: '10.0.0.100',
      mics: [8],
      connectors: [2],
      source: CODEC_AUX,
      layout: 'Prominent',       // Layout to use
      presetZone: Z0 // use a camera preset zone (Z1, Z2, Z3, etc..) instead of a layout with specific connectors.
    },
    {
      name: 'Aux2',     // Name for your composition
      codecIP: '10.0.0.110',
      mics: [7],
      connectors: [3],
      source: CODEC_AUX,
      layout: 'Prominent',       // Layout to use
      presetZone: Z0 // use a camera preset zone (Z1, Z2, Z3, etc..) instead of a layout with specific connectors.
    },
    { //IMPORTANT: There needs to at least one overview composition with mics: [0].
      // NOTE: if you wish to show several presets in a composition or a combination of presets and 
      // non-preset camera or video inputs for Aux codecs, specify the presets to use in the presetZone key below
      // as an array (i.e. [11,12]) but also include the video connector ID for the cameras for those 
      // presets in the connectors array below in the right order so the macro knows how to lay them out in the composition
      // (i.e. connectors:[2,3,1,4] if the connectorID for the camera associated for preset 11 is 2, 
      // the connectorID for the camera associated for preset 12 is 3 and you want to also include input from quadcam
      // at connector 1 and video from tieline from secondary in connector 4 as the overview shot.)
      // When specifying an array as the presetZone value, remember those are preset IDs, not preset zones. 
      name: 'Overview',  // The name used here will show up in the selector box in the custom Camera Control Panel if you configure more than one
      codecIP: '',       // only the first 4 'overview' type compositions you set up will be offered in the selector box in the custom Camera Control Panel
      mics: [0],      // IMPORTANT: There needs to at least one overview composition with mics: [0]
      connectors: [3, 1, 2], // Specify here the video inputs and order to use to compose the "side by side" view. It can just be one. 
      source: CODEC_NONE, // Use CODEC_NONE for these types of 'overview' compositions. 
      layout: 'Equal',       // Layout to use
      presetZone: Z0 // use a camera preset zone (Z1, Z2, Z3, etc..) or array of specific preset IDs  
      // NOTE: do not set preset to just one integer if you want more than one video input to be layed out, if you only
      // have one preset but still want to specify other connectos in the layout then specify and array of just one preset
      // (i.e. preset: [11] if only preset 11 will be used and connectors:[2,1,4] if you want to compose it input from the
      // camera doing the preset with connectors 1 and 4 as well.)
      // Setting preset to just one integeter will force it to ignore the connectors value and interpret it as a preset zone (Z1, Z2, Z3, etc..)
      // Set presetZone to Z0 if no presets nor preset zones will be used. 
    }
  ]
}

// The auto_top_speakers object below controls if the macro should show the top N speakers in a composition
// when multiple people are speaking at the same time. Set the enabled property to true to enable it. 
const auto_top_speakers = {
  enabled: false, // if set to true, the macro will dynamically create composition of top speaker segments
  max_speakers: 2, // specify maximum number of top speaker segments to compose
  default_connectors: [1, 2, 3, 4], // specify connectos to use for top speakers composition in order
  // if you have presetZones in any of the compositions that could end up bein selected for the top N composition, 
  // be sure to add the connector ID where the camera associated with the primary preset of that presetZone 
  // into the default_connectors array in the right position you want it. 
  layout: 'Equal'
}


/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/


// This macro requires preset 30 to be present to be able to set the overview shots. If you do not 
// manually create it as per instructions and you have a Quadcam,  the macro will create a default preset 30 as a fully zoomed
// out view of that QuadCam. You can also just specify the values for Pan, tilt and zoom for that macro below and define
// if the macro actually always re-creates the preset irrespective if already there by setting ALWAYS_CREATE_OV_PRESET to true
// if you leave OV_PRESET_PAN, OV_PRESET_TILT or OV_PRESET_ZOOM set to 0 the macro will just create the default  
// zoomed out overview shot if needed.
// Irrespective of you set the ALWAYS_CREATE_OV_PRESET constant below,  you might want to copy the parameters 
// of that preset if you manually created it or adjusted it in the command line 
// into OV_PRESET_PAN, OV_PRESET_TILT and OV_PRESET_ZOOM below in case you lose the preset with an upgrade or reset
// or if someone manually removes it. You can obtain the current values of that preset from the command line of the codec by issuing
// this command: xCommand Camera Preset Show PresetId: 30
const ALWAYS_CREATE_OV_PRESET = false;
const OV_PRESET_PAN = 0
const OV_PRESET_TILT = 0
const OV_PRESET_ZOOM = 0


/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/


// Specifying which sourceID belongs to local QuadCam
// MAIN_CODEC_QUADCAM_SOURCE_ID should contain the SourceID where the QuadCam connected
// to the main codec (if any) is connected. This it typically SourceID 1. If no QuadCam is connected
// then set this to 0
//TODO: check with peripherals connected to see if a QuadCam is connected or not 
const MAIN_CODEC_QUADCAM_SOURCE_ID = 1;

// In RoomOS 11 there are multiple SpeakerTrack default behaviors to choose from on the navigator or
// Touch10 device. Set ST_DEFAULT_BEHAVIOR to the one you want this macro to use from these choices:
// Auto: The same as BestOverview.
// BestOverview: The default framing mode is Best overview. 
// Closeup: The default framing mode is Closeup (speaker tracking). 
// Current: The framing mode is kept unchanged when leaving a call. 
// Frames: The default framing mode is Frames.
const ST_DEFAULT_BEHAVIOR = 'Closeup'

// If you wish to remove a video input from the overview shot if the Aux codec that 
// sends it is not reporting anyone in front of the camera, set REMOVE_EMPTY_SEGMENTS to false
// this will also apply for the QuadCam in the main codec, but if the logic ends up removing all segments
// it will actually show them all so the other side sees that there is simply nobobody in the room. 
// If an Aux codec does not have a camera capable of doing PeopleCount or it is disaled, that codec will always
// report that there are people in the shot. 
const REMOVE_EMPTY_SEGMENTS = false

// This next line hides the mid-call controls “Lock meeting” and “Record”.  The reason for this is so that the
// “Camera Control” button can be seen.  If you prefer to have the mid-call controls showing, change the value of this from “Hidden” to “Auto”
xapi.Config.UserInterface.Features.Call.MidCallControls.set("Hidden");

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

TIMERS and THRESHOLDS
*/

// Time to wait for silence before setting Speakertrack Side-by-Side mode
const SIDE_BY_SIDE_TIME = 10000; // 10 seconds
// Time to wait before switching to a new speaker
const NEW_SPEAKER_TIME = 2000; // 2 seconds
// Time to wait before activating automatic mode at the beginning of a call
const INITIAL_CALL_TIME = 15000; // 15 seconds
// time to wait after setting a camera preset before switching to it's source to prevent
// transmitting video during camera movement for P60 and PTZ cameras
const VIDEO_SOURCE_SWITCH_WAIT_TIME = 500; // 500 ms

// Microphone High/Low Thresholds
const MICROPHONELOW = 6;
const MICROPHONEHIGH = 25;

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

Presenter Track Q&A Mode
*/
// ALLOW_PRESENTER_QA_MODE controls if the custom panel for activating PresenterTrack with or without 
// Q&A Mode is shown in the Touch10 or Navigator. Without it, you cannot activate PresenterTrack Q&A mode
const ALLOW_PRESENTER_QA_MODE = false;

//PRESENTER_QA_AUDIENCE_MIC_IDS is an array for Mic IDs that are being used for the audience. 
const PRESENTER_QA_AUDIENCE_MIC_IDS = [1, 2]


// PRESENTER_QA_KEEP_COMPOSITION_TIME is the time in ms that the macro will keep sending
// a composed image of the presenter and an audience member asking a question after the question
// has been asked by any audience member. If different audience members ask questions while the composition 
// is being shown after NEW_SPEAKER_TIME milliseconds have passed, the composition will change 
// to use that new audience member instead of the original. This will continue until no other audience members have
// spoken for PRESENTER_QA_KEEP_COMPOSITION_TIME milliseconds and then the code will resume sending only the 
// full video feed from the Presenter camera 
const PRESENTER_QA_KEEP_COMPOSITION_TIME = 7000

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ DO NOT EDIT ANYTHING BELOW THIS LINE                                  +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/



const minOS10Version = '10.17.1.0';
const minOS11Version = '11.0.0.4';



var top_speakers_connectors = [];
var mic_connectors_map = {}
var connectors_preset_map = {}
var currOverviewComp = "";
var overviewCompNames = []


var comp_sets_array = [] // array of top speaker compositions to keep track of for last speaker value

var aux_connectors_map = {}

// create a map of microphones to corresponding main video connector
config.compositions.forEach(compose => {
  compose.mics.forEach(async mic => {
    if (mic > 0)
      if (compose.presetZone == Z0)
        mic_connectors_map[mic] = compose.connectors[0];
      else {
        //extract connector ID corresponding to primary camera of this zone go put into the mic_connectors_map
        // so that later we can keep track of which presets to invoke before showing the top N view
        let thePresetId = compose.presetZone['primary'];
        let presetCamId = await getPresetCamera(thePresetId);
        let presetCamConnector = await xapi.Status.Cameras.Camera[presetCamId].DetectedConnector.get().catch(handleError);;
        mic_connectors_map[mic] = parseInt(presetCamConnector);
        // keep track of which video connector was added here due to a primary preset in a presetZone
        // so we can set that preset before showing the top N composition
        connectors_preset_map[presetCamConnector] = thePresetId;

      }
  })
  // populate array of overview composition names and populate currOverviewComp 
  // with first composition defined
  if (compose.mics.length == 1)
    if (compose.mics[0] == 0) {
      overviewCompNames.push(compose.name)
      if (currOverviewComp == "") currOverviewComp = compose.name;
    }
});


// create a map of microphones to corresponding main video connector
config.compositions.forEach(compose => {
  aux_connectors_map[compose.codecIP] = compose.connectors
});


// Validate config settings
async function validate_config() {
  let hasOverview = true;

  // allow up to 8 analog mics
  let allowedMics = [1, 2, 3, 4, 5, 6, 7, 8];

  let allowedEthernetMics = []
  // allow up to 8 ethernet mics with 8 lobes each
  for (let i = 1; i <= 8; i++) {
    for (let j = 1; j <= 8; j++) {
      allowedEthernetMics.push((i * 10) + j)
    }
  }

  let allowedUSBMics = []
  // allow up to 4 USB mics
  for (let i = 1; i <= 4; i++) {
    allowedUSBMics.push(100 + i)
  }


  let allowedExternalMics = []
  // allow up to  99 External mics
  for (let i = 1; i <= 99; i++) {
    allowedExternalMics.push(900 + i)
  }


  // only allow up to 8 analog microphones
  if (config.monitorMics.length > 8)
    await disableMacro(`config validation fail: config.monitorMics can only have up to 8 entries. Current value: ${config.MonitorMics} `);
  // only allow up to 8 analog microphones
  if (config.ethernetMics.length > 64)
    await disableMacro(`config validation fail: config.ethernetMics can only have up to 64 entries. Current value: ${config.ethernetMics} `);
  // only allow up to 8 analog microphones
  if (config.usbMics.length > 4)
    await disableMacro(`config validation fail: config.usbMics can only have up to 4 entries. Current value: ${config.usbMics} `);
  if (config.externalMics.length > 99)
    await disableMacro(`config validation fail: config.externalMics can only have up to 99 entries. Current value: ${config.ethernetMics} `);

  if ((config.monitorMics.length + config.ethernetMics + config.usbMics.length + config.externalMics.length) < 1)
    await disableMacro(`config validation fail: there must be at least one microphone configured between config.monitorMics, config.ethernetMics , config.usbMics and config.externalMics.`);


  // Check if using USB mic/input, that Echo control is turned on
  if (config.usbMics.length > 0) {
    const usbEchoControl = await xapi.Config.Audio.Input.USBInterface[1].EchoControl.Mode.get()
    if (usbEchoControl != 'On')
      await disableMacro(`config validation fail: when using USB microphone input, Echo Control needs to be enabled. Only asynchronous USB devices are supported. Please enable and re-activate macro`);

  }

  // make sure the mics are within those specified in the monitorMics array
  if (!config.monitorMics.every(r => allowedMics.includes(r)))
    await disableMacro(`config validation fail: config.monitorMics can only have analog mic ids 1-8. Current value: ${config.monitorMics} `);

  if (!config.ethernetMics.every(r => allowedEthernetMics.includes(r)))
    await disableMacro(`config validation fail: config.ethernetMics can only include Ethernet mics 1-8(8 lobes each). Current value: ${config.ethernetMics} `);

  if (!config.usbMics.every(r => allowedUSBMics.includes(r)))
    await disableMacro(`config validation fail: config.usbMics can only include USB mics 1-4 (values 101-104). Current value: ${config.usbMics} `);

  if (!config.externalMics.every(r => allowedExternalMics.includes(r)))
    await disableMacro(`config validation fail: config.externalMics can only include external mics 01-99 (values 901-999). Current value: ${config.externalMics} `);


  // check for duplicates in config.monitorMics
  if (new Set(config.monitorMics).size !== config.monitorMics.length)
    await disableMacro(`config validation fail: config.monitorMics cannot have duplicates. Current value: ${config.monitorMics} `);
  if (new Set(config.ethernetMics).size !== config.ethernetMics.length)
    await disableMacro(`config validation fail: config.ethernetMics cannot have duplicates. Current value: ${config.ethernetMics} `);
  if (new Set(config.usbMics).size !== config.usbMics.length)
    await disableMacro(`config validation fail: config.usbMics cannot have duplicates. Current value: ${config.usbMics} `);

  // Check for valid audience mics configured for the Presenter QA Mode feature
  if (ALLOW_PRESENTER_QA_MODE)
    if (!PRESENTER_QA_AUDIENCE_MIC_IDS.every(r => config.monitorMics.includes(r)) &&
      !PRESENTER_QA_AUDIENCE_MIC_IDS.every(r => config.ethernetMics.includes(r)) &&
      !PRESENTER_QA_AUDIENCE_MIC_IDS.every(r => config.externalMics.includes(r)) &&
      !PRESENTER_QA_AUDIENCE_MIC_IDS.every(r => config.usbMics.includes(r)))
      await disableMacro(`config validation fail: PRESENTER_QA_AUDIENCE_MIC_IDS can only specify values contained in config.monitorMics, config.ethernetMics, CONF.config.ethernetMics or config.usbMics . Current values PRESENTER_QA_AUDIENCE_MIC_IDS: ${PRESENTER_QA_AUDIENCE_MIC_IDS}`);


  hasOverview = false;
  // add value 0 to allowedMics array to include overview composition
  allowedMics.push(0)
  // consolidate all allowed mics to check each composition for valid mics.
  allowedMics = allowedMics.concat(allowedEthernetMics, allowedUSBMics, allowedExternalMics)

  // now let's check each composition
  for (let i = 0; i < config.compositions.length; i++) {
    let compose = config.compositions[i];
    // make sure each composition is marked  CODEC_MAIN, CODEC_AUX or CODEC_NONE
    if (![CODEC_MAIN, CODEC_AUX, CODEC_NONE].includes(compose.source)) await disableMacro(`config validation fail: composition named ${compose.name} should have a valid value for key 'source' (CODEC_MAIN, CODEC_AUX or CODEC_NONE).`);

    // make sure if CODEC_AUX source, then there is a real IP address configured
    if (compose.source == CODEC_AUX)
      if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(compose.codecIP))
        await disableMacro(`config validation fail: Invalid IP address for composition ${compose.name}: ${compose.codecIP} `);

    // only allow up to 8 mics and at least 1 specified for each composition
    if (compose.mics.length > 175 || compose.mics.length < 1)
      await disableMacro(`config validation fail: mics for each composition can only have between 1 and 175 entries. Current value: ${compose.mics} `);


    // make sure the mics are within those specified in the monitorMics array, plus 0 for overview
    if (!compose.mics.every(r => allowedMics.includes(r)))
      await disableMacro(`config validation fail: mics for each composition can only have mic ids 0-8, 11-88, 101-104 or 901-999. Current value: ${compose.mics} `);

    // keep track that we have at least one composition with mics [0] to check at the end and that it is CODEC_NONE sourced
    if (JSON.stringify(compose.mics) == JSON.stringify([0]) && compose.source == CODEC_NONE) hasOverview = true;
  }

  // check that there was at least one Overview composition with mics==[0]
  if (!hasOverview)
    await disableMacro('config validation fail: no overview composition configured or it does not have source set to CODEC_NONE');

  // all went well, can return true!
  return true;
}

let overviewCompRowValue = ''
if (overviewCompNames.length > 1) {
  overviewCompRowValue = `
  <Row>
  <Name>Overview Comp</Name>
  <Widget>
    <WidgetId>widget_ov_settings</WidgetId>
    <Type>GroupButton</Type>
    <Options>size=4</Options>
    <ValueSpace>
    `
  overviewCompNames.forEach((overviewName, index) => {
    if (index < 4) {
      overviewCompRowValue += `
      <Value>
        <Key>${(index + 1).toString()}</Key>
        <Name>${overviewName}</Name>
      </Value>
      `
    }

  })
  overviewCompRowValue += `
    </ValueSpace>
  </Widget>
  </Row>
    `
}

const PANEL_Control_Automation = `<Extensions>
<Version>1.8</Version>
<Panel>
  <Order>1</Order>
  <PanelId>panel_manual_override</PanelId>
  <Origin>local</Origin>
  <Location>HomeScreenAndCallControls</Location>
  <Icon>Camera</Icon>
  <Color>#07C1E4</Color>
  <Name>Camera Control</Name>
  <ActivityType>Custom</ActivityType>
  <Page>
    <Name>Camera Control</Name>
    <Row>
      <Name>Camera switching</Name>
      <Widget>
        <WidgetId>widget_8</WidgetId>
        <Name>Manual</Name>
        <Type>Text</Type>
        <Options>size=1;fontSize=normal;align=center</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_override</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_6</WidgetId>
        <Name>Auto</Name>
        <Type>Text</Type>
        <Options>size=null;fontSize=normal;align=center</Options>
      </Widget>
    </Row>
    <Row>
      <Name>Side by side mode</Name>
      <Widget>
        <WidgetId>widget_sbs_a</WidgetId>
        <Name>Overview</Name>
        <Type>Text</Type>
        <Options>size=2;fontSize=normal;align=right</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_sbs_control</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_sbs_b</WidgetId>
        <Name>Always</Name>
        <Type>Text</Type>
        <Options>size=null;fontSize=normal;align=center</Options>
      </Widget>
    </Row>
    <Row>
      <Name>Test FullScreen Selfview</Name>
      <Widget>
        <WidgetId>widget_14</WidgetId>
        <Name>Off</Name>
        <Type>Text</Type>
        <Options>size=1;fontSize=normal;align=center</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_FS_selfview</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
      <Widget>
        <WidgetId>widget_12</WidgetId>
        <Name>On</Name>
        <Type>Text</Type>
        <Options>size=null;fontSize=normal;align=center</Options>
      </Widget>
    </Row>
    <Row>
    <Name>Force Frames</Name>
    <Widget>
      <WidgetId>widget_15</WidgetId>
      <Name>Off</Name>
      <Type>Text</Type>
      <Options>size=1;fontSize=normal;align=center</Options>
    </Widget>
    <Widget>
      <WidgetId>widget_force_frames</WidgetId>
      <Type>ToggleButton</Type>
      <Options>size=1</Options>
    </Widget>
    <Widget>
      <WidgetId>widget_16</WidgetId>
      <Name>On</Name>
      <Type>Text</Type>
      <Options>size=null;fontSize=normal;align=center</Options>
    </Widget>
    </Row>
    ${overviewCompRowValue}
    <PageId>panel_manual_override</PageId>
    <Options/>
  </Page>
</Panel>
</Extensions>
`

xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: 'panel_manual_override' },
  PANEL_Control_Automation);

if (overviewCompNames.length > 1) {
  let selectionID = overviewCompNames.indexOf(currOverviewComp);
  if (selectionID >= 0 && selectionID < 4)
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_ov_settings', Value: (selectionID + 1).toString() }).catch(handleMissingWigetError);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function disableMacro(reason = 'N/A') {
  console.warn(reason)
  let act = `Disabling [${module.name.replace('./', '')}] in 10 seconds`
  console.error({ Error: reason, Action: act })
  await xapi.Command.UserInterface.Message.Alert.Display({ Title: '⚠️ Macro Error ⚠️', Text: `${reason}<p>${act}`, Duration: 9 });
  await delay(10000);
  await xapi.Command.Macros.Macro.Deactivate({ Name: module.name.replace('./', '') });
  await delay(100);
  await xapi.Command.Macros.Runtime.Restart();
}


async function checkOverviewPreset() {
  console.log('Checking for existence of preset 30 for Camera 1')
  let pre_list = await xapi.Command.Camera.Preset.List(
    { CameraId: 1 })
  let pre_exists = false;
  if ('Preset' in pre_list) {
    pre_list.Preset.forEach(preObj => {
      if (preObj.PresetId == '30') pre_exists = true;
    })
  }
  if (!pre_exists || ALWAYS_CREATE_OV_PRESET) {
    if (!pre_exists) console.log('Preset 30 does not exist!')
    console.log('Creating preset 30....')
    if (MAIN_CODEC_QUADCAM_SOURCE_ID != 0) {
      if (OV_PRESET_PAN != 0 && OV_PRESET_TILT != 0 && OV_PRESET_ZOOM != 0)
        await xapi.Command.Camera.PositionSet({ CameraId: MAIN_CODEC_QUADCAM_SOURCE_ID, Zoom: OV_PRESET_ZOOM, Tilt: OV_PRESET_TILT, Pan: OV_PRESET_PAN });
      else
        await xapi.Command.Camera.PositionSet({ CameraId: MAIN_CODEC_QUADCAM_SOURCE_ID, Zoom: 12000 });

      await delay(1000);
      await xapi.Command.Camera.Preset.Store(
        { CameraId: 1, Name: "Overview", PresetId: 30 });
      console.log('Preset 30 created')
    } else {
      console.warn(`WARNING: Camera Preset 30 does not exist and there is not QuadCam defined, just must manually create preset 30 as per instructions.`)
    }
  }
}



const localCallout = new GMM.Connect.Local(module.name.replace('./', ''))


/////////////////////
// MAPPING VALIDATION
/////////////////////

const sleep = (timeout) => new Promise((resolve) => {
  setTimeout(resolve, timeout);
});


/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
/////////////////////////////////////////////////////////////////////////////////////////

var AUX_CODEC_STATUS = {}

//Declare your object for GMM communication
var auxCodecs = {};

let micArrays = {};
for (var i in config.monitorMics) {
  micArrays[config.monitorMics[i].toString()] = [0, 0, 0, 0];
}
for (var i in config.ethernetMics) {
  micArrays[config.ethernetMics[i].toString()] = [0, 0, 0, 0];
}
for (var i in config.usbMics) {
  micArrays[config.usbMics[i].toString()] = [0, 0, 0, 0];
}
let lowWasRecalled = false;
let lastActiveHighInput = 0;
let lastSourceDict = { SourceID: '1' }
let allowSideBySide = true;
let sideBySideTimer = null;
let InitialCallTimer = null;
let allowCameraSwitching = false;
let allowNewSpeaker = true;
let newSpeakerTimer = null;
let manual_mode = true;
let lastActivePTZCameraZoneObj = Z0;
let lastActivePTZCameraZoneCamera = '0';

let manualSetFrames = false;

let tempDisable = false;


let perma_sbs = false; // set to true if you want to start with side by side view always

let micHandler = () => void 0;
let micHandlerEthernet = () => void 0;
let micHandlerUSB = () => void 0;

let usb_mode = false;
let webrtc_mode = false;

let isOSTen = false;
let isOSEleven = false;

let forceFramesOn = false;

let PRESENTER_QA_MODE = false

let presenterTrackConfigured = false;
let presenterTracking = false;
let presenterDetected = true;
let presenterQAKeepComposition = false;
let qaCompositionTimer = null;

var MAP_PTZ_CAMERA_VIDEO_SOURCE_ID = {};


/////////////////////////////////////////////////////////////////////////////////////////
// UTILITIES
/////////////////////////////////////////////////////////////////////////////////////////

async function getPresetCamera(prID) {
  const value = await xapi.Command.Camera.Preset.Show({ PresetId: prID });
  return (value.CameraId)
}

async function check4_Minimum_Version_Required(minimumOs) {
  const reg = /^\D*(?<MAJOR>\d*)\.(?<MINOR>\d*)\.(?<EXTRAVERSION>\d*)\.(?<BUILDID>\d*).*$/i;
  const minOs = minimumOs;
  const os = await xapi.Status.SystemUnit.Software.Version.get();
  console.log(os)
  const x = (reg.exec(os)).groups;
  const y = (reg.exec(minOs)).groups;
  if (parseInt(x.MAJOR) > parseInt(y.MAJOR)) return true;
  if (parseInt(x.MAJOR) < parseInt(y.MAJOR)) return false;
  if (parseInt(x.MINOR) > parseInt(y.MINOR)) return true;
  if (parseInt(x.MINOR) < parseInt(y.MINOR)) return false;
  if (parseInt(x.EXTRAVERSION) > parseInt(y.EXTRAVERSION)) return true;
  if (parseInt(x.EXTRAVERSION) < parseInt(y.EXTRAVERSION)) return false;
  if (parseInt(x.BUILDID) > parseInt(y.BUILDID)) return true;
  if (parseInt(x.BUILDID) < parseInt(y.BUILDID)) return false;
  return false;
}

/////////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION
/////////////////////////////////////////////////////////////////////////////////////////

function evalPresenterTrack(value) {
  let currentVal = '1';
  if (presenterTrackConfigured) {
    if (value === 'Follow' || value === 'Persistent') {
      if (PRESENTER_QA_MODE) {
        currentVal = '3';
      }
      else {
        currentVal = '2';
      }
    }
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_pt_settings', Value: currentVal }).catch(handleMissingWigetError);
  }
}

function evalFullScreen(value) {
  if (value == 'On') {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_FS_selfview', Value: 'on' });
  }
  else {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_FS_selfview', Value: 'off' });
  }
}

// evalFullScreenEvent is needed because we have to check when someone manually turns on full screen
// when self view is already selected... it will eventually check FullScreen again, but that should be
// harmless
function evalFullScreenEvent(value) {
  if (value == 'On') {
    xapi.Status.Video.Selfview.Mode.get().then(evalSelfView);
  }
  else {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_FS_selfview', Value: 'off' });
  }
}

function evalSelfView(value) {
  if (value == 'On') {
    xapi.Status.Video.Selfview.FullscreenMode.get().then(evalFullScreen);
  }
  else {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_FS_selfview', Value: 'off' });
  }
}

async function init() {
  console.log('init');
  xapi.Status.Cameras.SpeakerTrack.State.on(value => console.log("SpeakerTrack state: ", value));
  await xapi.Config.RoomAnalytics.PeoplePresenceDetector.set('On');
  await xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');

  if (!await validate_config()) disableMacro("invalid config")
  // make sure Preset 30 exists, if not create it with just an overview shot of camera ID 1 which should be the QuadCam
  checkOverviewPreset();

  // create camera ID to source ID Map
  let allCameras = await xapi.Status.Cameras.Camera.get()
  //console.info({ Info: `All cameras`, allCameras })
  allCameras.forEach(async camera => {
    //camerasConnectorMap[camera.id] = parseInt(camera.DetectedConnector)
    if (camera.DetectedConnector > 0) {
      let theSourceID = await xapi.Status.Video.Input.Connector[camera.DetectedConnector].SourceId.get()
      MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[camera.id] = parseInt(theSourceID)
    }
  })

  // check for presenterTrack being configured
  let enabledGet = await xapi.Config.Cameras.PresenterTrack.Enabled.get()
  presenterTrackConfigured = (enabledGet == 'True') ? true : false;
  addCustomAutoQAPanel();

  let codecIPArray = [];

  config.compositions.forEach(compose => {
    if (compose.codecIP != '' && compose.source == CODEC_AUX) {
      console.log(`Setting up connection to aux codec with IP ${compose.codecIP}`);
      //auxCodec[compose.codecIP] = new GMM.Connect.IP(AUX_CODEC_USERNAME, AUX_CODEC_PASSWORD, compose.codecIP)
      //console.log(`Creating aux status object for this aux codec...`)
      console.log(`Adding IP address of aux codec to array to create connection object...`)
      codecIPArray.push(compose.codecIP);
      AUX_CODEC_STATUS[compose.codecIP] = { enable: true, 'online': false, 'haspeople': true };
    }
  })

  // now creating one connection object that sends to multiple aux codecs
  // but only if there are aux codecs configured, otherwise leave as initialized as {}
  if (codecIPArray.length > 0) {
    if (AUX_CODEC_USERNAME == '')
      console.error(`Missing username or base64 encoded credentials for aux codecs.. will not connect aux codecs!`);
    else
      auxCodecs = new GMM.Connect.IP(AUX_CODEC_USERNAME, AUX_CODEC_PASSWORD, codecIPArray)
  }


  // Stop any VuMeters that might have been left from a previous macro run with a different config.monitorMics constant
  // to prevent errors due to unhandled vuMeter events.
  xapi.Command.Audio.VuMeter.StopAll({});

  // register callback for processing manual mute setting on codec
  xapi.Status.Audio.Microphones.Mute.on((state) => {
    console.log(`handleMicMuteResponse: ${state}`);

    if (state == 'On') {
      stopSideBySideTimer();
      setTimeout(handleMicMuteOn, 2000);
    }
    else if (state == 'Off') {
      handleMicMuteOff();
    }
  });

  // register event handlers for local events
  xapi.Status.Standby.State
    .on(value => {
      console.log(value);
      if (value == "Off") handleWakeUp();
      if (value == "Standby") handleShutDown();
    });

  // register handler for Widget actions
  xapi.event.on('UserInterface Extensions Widget Action', (event) =>
    handleOverrideWidget(event));

  // register handler for Call Successful
  xapi.Event.CallSuccessful.on(async () => {
    if (!tempDisable) {
      console.log("Starting new call timer...");
      await startAutomation();
      recallSideBySideMode();
      startInitialCallTimer();
    }
    else {
      console.log("Ignoring new call event due to tempDisable==true");
    }
  });

  // register handler for Call Disconnect
  xapi.Event.CallDisconnect.on(async () => {
    console.log("Turning off Self View....");
    xapi.Command.Video.Selfview.Set({ Mode: 'off' });
    webrtc_mode = false; // ending webrtc calls is being notified here now in RoomOS11
    stopAutomation();
  });

  // check RoomOS versions

  isOSTen = await check4_Minimum_Version_Required(minOS10Version);
  isOSEleven = await check4_Minimum_Version_Required(minOS11Version);

  // register WebRTC Mode and HDMI Passhtorugh mode handlers if RoomOS 11
  if (isOSEleven) {
    xapi.Status.UserInterface.WebView.Type.on(async (value) => {
      if (value === 'WebRTCMeeting') {
        webrtc_mode = true;
        if (!tempDisable) {
          console.log("Starting automation due to WebRTCMeeting event...");
          startAutomation();
          startInitialCallTimer();
        }
        else {
          console.log("WebRTCMeeting event received, but tempDisable==false ...");
        }
      } else {
        webrtc_mode = false;
        if (!usb_mode) {
          console.log("Turning off Self View....");
          xapi.Command.Video.Selfview.Set({ Mode: 'off' });
          console.log("Stopping automation due to a non-WebRTCMeeting  event...");
          stopAutomation();
        }

      }
    });

    xapi.Status.Video.Output.HDMI.Passthrough.Status.on(value => {
      console.log(value)
      if (value == 'Active') {
        console.warn(`System is in Passthrough Active Mode`)
        startAutomation();
        usb_mode = true;
      } else {
        console.warn(`System is in Passthrough Inactive Mode`)
        stopAutomation();
        usb_mode = false;
      }
    });

    // register to keep track of when Frames is manually activated.
    xapi.Status.Cameras.SpeakerTrack.Frames.Status
      .on(async value => {
        //console.log(value)
        if (manualSetFrames) {
          manualSetFrames = false;
        }
        else {
          if (value === 'Inactive') {
            forceFramesOn = false;
            xapi.Command.Cameras.SpeakerTrack.Frames.Deactivate();
            await sendIntercodecMessage('force_frames_off')
          }
          else {
            forceFramesOn = true;
            xapi.Command.Cameras.SpeakerTrack.Frames.Activate();
            await sendIntercodecMessage('force_frames_on')
          }
        }
      });
  }

  //  set self-view toggle on custom panel depending on Codec status that might have been set manually
  xapi.Status.Video.Selfview.Mode.get().then(evalSelfView);

  // register to receive events when someone manually turns on self-view
  // so we can keep the custom toggle button in the right state
  xapi.Status.Video.Selfview.Mode.on(evalSelfView);

  // register to receive events when someone manually turns on full screen mode
  // so we can keep the custom toggle button in the right state if also in self view
  xapi.Status.Video.Selfview.FullscreenMode.on(evalFullScreenEvent);

  // next, set Automatic mode toggle switch on custom panel off since the macro starts that way
  xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_override', Value: 'off' });

  // next, set side by side mode panel to whatever is configured initially
  xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_sbs_control', Value: (perma_sbs) ? 'on' : 'off' });



}


/////////////////////////////////////////////////////////////////////////////////////////
// START/STOP AUTOMATION FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

async function startAutomation() {
  console.log('startAutomation');
  //setting overall manual mode to false
  manual_mode = false;
  allowCameraSwitching = true;

  // presenterTrack cannot be on when we start automation
  if (presenterTrackConfigured) {
    xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
  }

  if (isOSEleven) {
    try {
      xapi.Config.Cameras.SpeakerTrack.DefaultBehavior.set(ST_DEFAULT_BEHAVIOR);
      if (ST_DEFAULT_BEHAVIOR == 'Frames') xapi.Command.Cameras.SpeakerTrack.Frames.Activate();
      else {
        xapi.Command.Cameras.SpeakerTrack.Frames.Deactivate();
        if (ST_DEFAULT_BEHAVIOR == 'Closeup') xapi.Config.Cameras.SpeakerTrack.Closeup.set('On');
      }

      const webViewType = await xapi.Status.UserInterface.WebView.Type.get()
      if (webViewType == 'WebRTCMeeting') webrtc_mode = true;
    } catch (e) {
      console.log('Unable to read WebView Type.. assuming not in webrtc mode')
    }
  }

  // Always turn on SpeakerTrack when the Automation is started. It is also turned on when a call connects so that
  // if it is manually turned off while outside of a call it goes back to the correct state
  if (MAIN_CODEC_QUADCAM_SOURCE_ID > 0) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);

  //registering vuMeter event handler for analog mics
  if (config.monitorMics.length > 0) {
    micHandler();
    micHandler = () => void 0;
    micHandler = xapi.event.on('Audio Input Connectors Microphone', (event) => {
      //adding protection for mis-configured mics
      if (typeof micArrays[event.id[0]] != 'undefined') {
        micArrays[event.id[0]].shift();
        micArrays[event.id[0]].push(event.VuMeter);

        // checking on manual_mode might be unnecessary because in manual mode,
        // audio events should not be triggered
        if (manual_mode == false) {
          // invoke main logic to check mic levels ans switch to correct camera input
          checkMicLevelsToSwitchCamera();
        }
      }
    });
  }


  //registering vuMeter event handler for Ethernet mics
  if (config.ethernetMics.length > 0) {
    micHandlerEthernet();
    micHandlerEthernet = () => void 0;
    micHandlerEthernet = xapi.event.on('Audio Input Connectors Ethernet', (event) => {
      //console.log(event)
      event.SubId.forEach(submic => {
        if (typeof micArrays[event.id + submic.id] != 'undefined') {
          micArrays[event.id + submic.id].shift();
          micArrays[event.id + submic.id].push(submic.VuMeter);
          if (manual_mode == false) {
            // invoke main logic to check mic levels ans switch to correct camera input
            checkMicLevelsToSwitchCamera();
          }
        }
      })

    });
  }

  //registering vuMeter event handler for USB mics
  if (config.usbMics.length > 0) {
    micHandlerUSB();
    micHandlerUSB = () => void 0;
    micHandlerUSB = xapi.event.on('Audio Input Connectors USBMicrophone', (event) => {
      //console.log(event)
      if (typeof micArrays['10' + event.id] != 'undefined') {
        micArrays['10' + event.id].shift();
        micArrays['10' + event.id].push(event.VuMeter);

        // checking on manual_mode might be unnecessary because in manual mode,
        // audio events should not be triggered
        if (manual_mode == false) {
          // invoke main logic to check mic levels ans switch to correct camera input
          checkMicLevelsToSwitchCamera();
        }
      }
    });
  }

  // start VuMeter monitoring
  console.log("Turning on VuMeter monitoring...")
  for (var i in config.monitorMics) {
    xapi.Command.Audio.VuMeter.Start(
      {
        ConnectorId: config.monitorMics[i],
        ConnectorType: 'Microphone',
        IncludePairingQuality: 'Off',
        IntervalMs: 500,
        Source: 'AfterAEC'
      });
  }

  let ethernetMicsStarted = [];
  for (var i in config.ethernetMics) {
    if (!ethernetMicsStarted.includes(parseInt(config.ethernetMics[i] / 10))) {
      ethernetMicsStarted.push(parseInt(config.ethernetMics[i] / 10));
      xapi.Command.Audio.VuMeter.Start(
        {
          ConnectorId: parseInt(config.ethernetMics[i] / 10),
          ConnectorType: 'Ethernet',
          IncludePairingQuality: 'Off',
          IntervalMs: 500,
          Source: 'AfterAEC'
        });
    }
  }


  for (var i in config.usbMics) {
    xapi.Command.Audio.VuMeter.Start(
      {
        ConnectorId: config.usbMics[i] - 100,
        ConnectorType: 'USBMicrophone',
        IncludePairingQuality: 'Off',
        IntervalMs: 500,
        Source: 'AfterAEC'
      });
  }


  // set toggle button on custom panel to reflect that automation is turned on.
  xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_override', Value: 'on' });
}

function stopAutomation(reset_source = true) {
  //setting overall manual mode to true
  manual_mode = true;
  stopSideBySideTimer();
  stopNewSpeakerTimer();
  stopInitialCallTimer();
  lastActiveHighInput = 0; //TODO: check to see if this improves turning on/off the automation
  lowWasRecalled = true; //TODO: check to see if this improves turning on/of the automation
  console.log("Stopping all VuMeters...");
  xapi.Command.Audio.VuMeter.StopAll({});
  //TODO: check to see if when we stop automation we really want to switch to connectorID 1
  if (reset_source) {
    console.log("Switching to MainVideoSource connectorID 1 ...");
    xapi.Command.Video.Input.SetMainVideoSource({ SourceId: 1 });
  }
  // using proper way to de-register handlers
  micHandler();
  micHandler = () => void 0;
  micHandlerEthernet();
  micHandlerEthernet = () => void 0;
  micHandlerUSB();
  micHandlerUSB = () => void 0;
  // set toggle button on custom panel to reflect that automation is turned off.
  xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_override', Value: 'off' });

}

/////////////////////////////////////////////////////////////////////////////////////////
// MICROPHONE DETECTION AND CAMERA SWITCHING LOGIC FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function checkMicLevelsToSwitchCamera() {
  // make sure we've gotten enough samples from each mic in order to do averages
  if (allowCameraSwitching) {

    // first let's check for top N mics with topNMicValue() which will also fill out needed
    // composition to use to set main video source 
    let topMics = topNMicValue();
    let input = topMics[0];
    let average = topMics[1]


    // someone is speaking
    if (average > MICROPHONEHIGH) {
      // start timer to prevent Side-by-Side mode too quickly
      restartSideBySideTimer();
      if (input != 0) {
        lowWasRecalled = false;
        // no one was talking before
        if (lastActiveHighInput === 0) {
          makeCameraSwitch(input, average);
        }
        // the same person is talking
        else if (lastActiveHighInput === input) {
          restartNewSpeakerTimer();
        }
        // a different person is talking
        else if (lastActiveHighInput !== input) {
          if (allowNewSpeaker) {
            makeCameraSwitch(input, average);
          }
        }
      }
    }
    // no one is speaking
    else if (average < MICROPHONELOW) {
      // only trigger if enough time has elapsed since someone spoke last
      if (allowSideBySide) {
        if (input > 0 && !lowWasRecalled) {
          lastActiveHighInput = 0;
          lowWasRecalled = true;
          /*
          console.log("-------------------------------------------------");
          console.log("Low Triggered");
          console.log("-------------------------------------------------");
          recallSideBySideMode();
          */
          makeCameraSwitch(0, average);
        }
      }
    }

  }
}



function processExternalMicHandler(activeMic) {
  // activeMic should contain a string with a external mic ID (00-99) passed along by the 
  // controller via MIC_ACTIVE_XX for us to trigger the switching functionality
  // we need to prepend the '9' character to it before parsing it into the integer for 
  // input so we can indicate it is an external mic specified in the CONF.config.externaMics array 
  let input = parseInt('9' + activeMic)
  let average = 0;
  if (allowCameraSwitching) {
    // simulate valide average to trigger switch since controller already made decision
    if (input > 900) {
      average = MICROPHONEHIGH + 1;
    }
    else {
      average = MICROPHONELOW - 1;
      input = 1; // need to simulate that there were valid mic readings
    }

    // someone is speaking
    if (average > MICROPHONEHIGH) {
      // start timer to prevent Side-by-Side mode too quickly
      restartSideBySideTimer();
      if (input > 900) {
        lowWasRecalled = false;
        // no one was talking before
        if (lastActiveHighInput === 0) {
          makeCameraSwitch(input, average);
        }
        // the same person is talking
        else if (lastActiveHighInput === input) {
          restartNewSpeakerTimer();
        }
        // a different person is talking
        else if (lastActiveHighInput !== input) {
          if (allowNewSpeaker) {
            makeCameraSwitch(input, average);
          }
        }
      }
    }
    // no one is speaking
    else if (average < MICROPHONELOW) {
      // only trigger if enough time has elapsed since someone spoke last
      if (allowSideBySide) {
        if (input > 0 && !lowWasRecalled) {
          lastActiveHighInput = 0;
          lowWasRecalled = true;
          console.log("-------------------------------------------------");
          console.log("External Mic Low Triggered");
          console.log("-------------------------------------------------");
          recallSideBySideMode();
        }
      }
    }

  }
}


// function to actually switch the camera input
async function makeCameraSwitch(input, average) {
  if (input > 0) {
    console.log("-------------------------------------------------");
    console.log("High Triggered: ");
    console.log(`Input = ${input} | Average = ${average}`);
    console.log("-------------------------------------------------");
  }
  else if (input == 0) {
    console.log("-------------------------------------------------");
    console.log("Low Triggered");
    console.log(`Average = ${average}`);
    console.log("-------------------------------------------------");
  }
  else {
    console.log("-------------------------------------------------");
    console.log("Multi-High Triggered");
    console.log(`Input = ${input} | Average = ${average}`);
    console.log("-------------------------------------------------");
  }

  // map the loudest mic to the corresponding composition which could be local or from an 
  // aux codec.

  if (perma_sbs) input = 0; // if permanent side by side is selected in the custom panel, just always show the overview

  lastActiveHighInput = input;

  if (input > 0) {
    let sourceDict = { ConnectorID: 0 } // Just initialize
    let initial_sourceDict = { ConnectorID: 0 } // to be able to compare later
    config.compositions.forEach(compose => {
      if (compose.mics.includes(input))
      //if (input != 0 || (input == 0 && compose.name == currOverviewComp)) 
      {
        console.log(`Setting to composition = ${compose.name}`);
        if (('presetZone' in compose) && (compose.presetZone != Z0)) {
          console.log(`Setting Video Input to preset [${compose.presetZone}] `);
          sourceDict = { PresetZone: compose.presetZone };
        }
        else {
          console.log(`Setting Video Input to connectors [${compose.connectors}] and Layout: ${compose.layout}`);
          sourceDict = { ConnectorId: compose.connectors, Layout: compose.layout }
        }
      }
    })

    if (presenterTracking && presenterDetected) {
      // if we have selected Presenter Q&A mode and the codec is currently in presenterTrack mode, invoke
      // that specific camera switching logic contained in presenterQASwitch()
      if (PRESENTER_QA_MODE && !webrtc_mode) presenterQASwitch(input, sourceDict);
      // if the codec is in presentertracking but not in PRESENTER_QA_MODE , simply ignore the request to switch
      // cameras since we need to keep sending the presenterTrack camera. 
    }
    else {
      if (!('PresetZone' in sourceDict)) {

        if (JSON.stringify(sourceDict) == JSON.stringify(initial_sourceDict)) {
          console.warn(`makeCameraSwitch(): Active mic did not match any composition and not in PresentarTrack mode... `)
          restartNewSpeakerTimer();
          return;
        }

        // the Video Input SetMainVideoSource does not work while Speakertrack is active
        // so we need to turn it off in case the previous video input was from a source where
        // SpeakerTrack is used.
        //xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
        pauseSpeakerTrack();
        // Switch to the source that is speficied in the same index position in MAP_CAMERA_SOURCE_IDS
        //sourceDict["SourceID"] = selectedSource.toString();
        console.log("Switching to input with SetMainVideoSource with dict: ", sourceDict)
        xapi.Command.Video.Input.SetMainVideoSource(sourceDict).catch(handleError);
        if (sourceDict.ConnectorId.includes(MAIN_CODEC_QUADCAM_SOURCE_ID)) {
          // if the codec is using a QuadCam (no SpeakerTrack camera allowed) then
          // turn back on SpeakerTrack function on the codec in case it was turned off in side by side mode.
          resumeSpeakerTrack();
        }

        // if we are not switching to a camera zone with PTZ cameras, we need to re-set the
        // lastActivePTZCameraZone Object to the "non-camera" value of Z0 as when we started the macro
        // because the decision tree on switching or not from a camera that was already pointed at someone
        // relies on the last video input source having been a PTZ camera video zone
        lastActivePTZCameraZoneObj = Z0;
        lastActivePTZCameraZoneCamera = '0';
      }
      else {
        switchToVideoZone(sourceDict.PresetZone, true);
      }
    }
  } else if (input < 0) {
    // Here we switch to the previously prepared composition that corresponds to 
    // the top N active speakers. 


    // first, just like in recallSidebySideMode(), we have to clear out the last Active values
    // so after a top N composition it actually switches to the next composition or source
    lastActivePTZCameraZoneObj = Z0;
    lastActivePTZCameraZoneCamera = '0';
    lastActiveHighInput = 0;

    console.log(`Switching to auto-generated top N speakers composition.`);
    console.log(`Setting Video Input to connectors [${top_speakers_connectors}]  and Layout: ${auto_top_speakers.layout}`)
    // first check to see if any connectors calculated on the top N list before
    // correspond to any presets in presetZones to activate them
    top_speakers_connectors.forEach(async connector => {
      if (connector in connectors_preset_map) {
        let thePresetID = connectors_preset_map[connector]
        console.log(`Connector ${connector} is associated to presetID ${thePresetID}, setting preset first.`);
        let sourceDict = { PresetId: thePresetID };
        await xapi.Command.Camera.Preset.Activate(sourceDict);
      }
    })
    // now we can go ahead and show the top N composition
    xapi.Command.Video.Input.SetMainVideoSource(
      {
        ConnectorId: top_speakers_connectors,
        Layout: auto_top_speakers.layout
      });
  }
  else if (allowSideBySide) recallSideBySideMode();

  // send required messages to auxiliary codec that also turns on speakertrack over there
  await sendIntercodecMessage('automatic_mode');

  restartNewSpeakerTimer();
}

async function switchToVideoZone(selectedSource, changeVideoSource) {
  // The mic input mapped to a PTZ camera is to be selected, first check that camera zone was already being used
  if (lastActivePTZCameraZoneObj == selectedSource && changeVideoSource) {
    // same camera zone as before, so we do not want to change the inUse value of that zone object (keep it inUse=true)
    console.log("Still using same camera zone, no need to Activate camera preset and switch main video input.")
  }
  else {
    var selectedSourcePrimaryCamID = '';
    var selectedSourceSecondaryCamID = '';
    var thePresetId = 0;
    var thePresetVideoSource = 0;
    // Since this is a camera zone,  first check if primary or secondary to be selected based on the possibility
    // that the previous zone was using the same physical camera than the new zone selected.
    selectedSourcePrimaryCamID = await getPresetCamera(selectedSource['primary']);
    if (selectedSourcePrimaryCamID != lastActivePTZCameraZoneCamera) {
      thePresetId = selectedSource['primary'];
      thePresetVideoSource = MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[selectedSourcePrimaryCamID]
      lastActivePTZCameraZoneObj = selectedSource;
      lastActivePTZCameraZoneCamera = selectedSourcePrimaryCamID;
    }
    else {
      selectedSourceSecondaryCamID = await getPresetCamera(selectedSource['secondary']);
      thePresetId = selectedSource['secondary'];
      thePresetVideoSource = MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[selectedSourceSecondaryCamID]
      lastActivePTZCameraZoneObj = selectedSource;
      lastActivePTZCameraZoneCamera = selectedSourceSecondaryCamID;

    }
    // instruct the codec to now use the correct camera preset
    console.log('Switching to preset ID: ' + thePresetId + ' which uses camera: ' + lastActivePTZCameraZoneCamera);
    await xapi.Command.Camera.Preset.Activate({ PresetId: thePresetId });

    // now set main video source to where the camera is connected if instructed
    if (changeVideoSource) setTimeout(function () {
      setMainVideoSource(thePresetVideoSource);
    }, VIDEO_SOURCE_SWITCH_WAIT_TIME);

    return thePresetVideoSource;
  }

}

function setMainVideoSource(thePresetVideoSource) {
  // the Video Input SetMainVideoSource does not work while Speakertrack is active
  // so we need to turn it off in case the previous video input was from a source where
  // SpeakerTrack is used.
  //if (MAIN_CODEC_QUADCAM_SOURCE_ID>0) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
  if (MAIN_CODEC_QUADCAM_SOURCE_ID > 0) pauseSpeakerTrack();

  let sourceDict = { SourceID: '0' }
  sourceDict["SourceID"] = thePresetVideoSource.toString();
  console.log("In setMainVideoSource() switching to input with SetMainVideoSource with dict: ", sourceDict)
  xapi.command('Video Input SetMainVideoSource', sourceDict).catch(handleError);
}



// function to actually switch the camera input when in presentertrack Q&A mode
async function presenterQASwitch(input, sourceDict) {

  if (!(PRESENTER_QA_AUDIENCE_MIC_IDS.includes(input))) {
    // Once the presenter starts talkin, we need to initiate composition timer
    // to remove composition only after the configured time has passed.
    restartCompositionTimer();
  }
  else if (lastActiveHighInput != input) {

    if ('PresetZone' in sourceDict) {
      let selectedSource = sourceDict.PresetZone;
      // invoke switchToVideoZone but just to invoke the right preset and return connector ID, not actually switch
      let thePresetVideoSource = await switchToVideoZone(selectedSource, false);
      // Replace the sourceDict that had the preset with just the correct Connector ID for the rest of the logic
      sourceDict = { 'ConnectorId': [thePresetVideoSource] }

    }


    // here we need to compose presenter with other camera where someone is speaking
    if ('ConnectorId' in sourceDict && sourceDict['ConnectorId'].length == 1) {
      let presenterSource = parseInt(await xapi.Config.Cameras.PresenterTrack.Connector.get());
      let connectorDict = { ConnectorId: [presenterSource, sourceDict['ConnectorId'][0]] };
      console.log("Trying to use this for connector dict in presenterQASwitch(): ", connectorDict)

      setComposedQAVideoSource(connectorDict);

      // Restart the timer that tells how long to keep the composition for when the same
      // person is asking questions or the presenter is talking
      //restartCompositionTimer();

      // Actually, when audience members speak, we must stop the composition
      // timer since only silence or speaker speaking should start it!
      stopCompositionTimer();
    } else {
      console.log(`Trying to use ${sourceDict} in presenterQASwitch() but is preset or multiple connectors, should be just 1 ConnectorId`);
      return;
    }

  }

  // send required messages to auxiliary codec that also turns on speakertrack over there
  await sendIntercodecMessage('automatic_mode');

  lastActiveHighInput = input;
  restartNewSpeakerTimer();
}

function setComposedQAVideoSource(connectorDict) {

  if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Mute();

  // always put speakertrack on background mode when switching around inputs 
  pauseSpeakerTrack();

  console.log("In setComposedQAVideoSource() switching to input with SetMainVideoSource with dict: ", connectorDict)
  xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
  lastSourceDict = connectorDict;

  const payload = { EditMatrixOutput: { sources: connectorDict["ConnectorId"] } };

  setTimeout(function () {
    //Let USB Macro know we are composing
    localCallout.command(payload).post()
  }, 250) //250ms delay to allow the main source to resolve first

  // only disable background mode if the audience camera is a QuadCam
  if (connectorDict.ConnectorId[1] == MAIN_CODEC_QUADCAM_SOURCE_ID) resumeSpeakerTrack();

  //if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Unmute();
  if (webrtc_mode && !isOSEleven) setTimeout(function () { xapi.Command.Video.Input.MainVideo.Unmute() }, WEBRTC_VIDEO_UNMUTE_WAIT_TIME);

}

function topNMicValue() {
  let theAverage = 0;
  let averagesMap = {}
  let input = 0;
  let average = 0;


  //NOTE: micArrays is indexed with string representations of integers that are the mic connector ID
  config.monitorMics.forEach(mic => {
    theAverage = averageArray(micArrays[mic.toString()]);
    averagesMap[mic] = theAverage;
  })

  config.ethernetMics.forEach(mic => {
    theAverage = averageArray(micArrays[mic.toString()]);
    averagesMap[mic] = theAverage;
  })

  config.usbMics.forEach(mic => {
    theAverage = averageArray(micArrays[mic.toString()]);
    averagesMap[mic] = theAverage;
  })

  let entries = Object.entries(averagesMap)
  let sorted = entries.sort((a, b) => a[1] - b[1]);

  //capture top mic and average in case we need to return just that below
  input = parseInt(sorted[sorted.length - 1][0])
  average = parseInt(sorted[sorted.length - 1][1])

  // check for auto_top_speakers disabled or less than 2 max_speakers or presenterTracking to just return top mic and value
  if (sorted.length > 0) {
    if (!auto_top_speakers.enabled || (auto_top_speakers.max_speakers < 2 || (presenterTracking && presenterDetected))) return [input, average]
  }
  else {
    return [0, 0];
  }

  // now that we know that auto_top_speakers is enabled and looking for 2 or more top speaker segments,
  // we iterate through averages focusing only on those above MICROPHONEHIGH
  // and map those to the corresponding connector and remove duplicates
  // then check to see if more than one top speakers are active to calculate the new layout
  let sorted_high_connectors = []
  let theSet = new Set()
  for (let i = sorted.length - 1; i >= 0; i--) {
    let mic_id = sorted[i][0]
    let mic_avg = sorted[i][1]
    let connector = mic_connectors_map[mic_id]
    if (mic_avg > MICROPHONEHIGH) {
      // push connector only if not already there
      if (!sorted_high_connectors.includes(connector)) {
        sorted_high_connectors.push(connector)
        theSet.add(connector)
      };
    }
  }

  // if after removing duplicates we have less than 2 entries, just return the originally expected values
  // of highest input and it's average
  if (sorted_high_connectors.length < 2) return [input, average]

  if (sorted_high_connectors.length > auto_top_speakers.max_speakers)
    sorted_high_connectors = sorted_high_connectors.slice(0, auto_top_speakers.max_speakers)

  // now set the top_speakers_connectors gobal variable as a filtered version of auto_top_speakers.default_connectors
  top_speakers_connectors = []
  let i = 0
  auto_top_speakers.default_connectors.forEach(connector => {
    if (sorted_high_connectors.includes(connector)) top_speakers_connectors.push(connector)
  })

  // now calculate and return a negative value
  // that corresponds with the unique unordered set of connectors that are being used
  let comp_index = 0

  for (let i = 0; i < comp_sets_array.length; i++) {
    if (difference(comp_sets_array[i], theSet).size == 0) { comp_index = -(i + 1); break; }
  }
  if (comp_index == 0) {
    comp_sets_array.push(theSet)
    comp_index = -(comp_sets_array.length);
  }
  input = comp_index

  return [input, average]
}

function difference(setA, setB) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

function averageArray(arrayIn) {
  let sum = 0;
  for (var i = 0; i < arrayIn.length; i++) {
    sum = sum + parseInt(arrayIn[i], 10);
  }
  let avg = (sum / arrayIn.length);
  return avg;
}

async function recallSideBySideMode() {

  if (presenterTracking) return; //TODO: more extensive testing of presenterTracking scenarios here
  //first we need to clear out the lastActivePTZCameraZone vars since we want to make sure
  // that after SideBySideMode is called, the next call to switchToVideoZone() does actually force
  // a switch
  lastActivePTZCameraZoneObj = Z0;
  lastActivePTZCameraZoneCamera = '0';
  let connectorDict = { ConnectorId: [0, 0] };
  //connectorDict["ConnectorId"] = OVERVIEW_DOUBLE_SOURCE_IDS;
  //console.log("Trying to use this for connector dict in recallSideBySideMode(): ", connectorDict)
  //xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
  //if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
  if (MAIN_CODEC_QUADCAM_SOURCE_ID > 0) pauseSpeakerTrack();

  config.compositions.forEach(async compose => {
    if (compose.mics.includes(0))
      if (compose.name == currOverviewComp) {
        console.log(`SideBySide setting to composition = ${compose.name}`);
        let sourceDict = {}
        if (('presetZone' in compose) && (compose.presetZone != Z0) && typeof compose.presetZone == 'number') {
          console.log(`SideBySide setting Video Input to preset [${compose.preset}] `);
          if (MAIN_CODEC_QUADCAM_SOURCE_ID > 0) pauseSpeakerTrack();
          switchToVideoZone(compose.presetZone, true);
        }
        else {
          let the_connectors = [...compose.connectors];

          if (compose.presetZone != Z0 && typeof compose.presetZone != 'number') { // if not single preset zone, it is a list of presets we need to evaluate
            console.log(`SideBySide setting Video Input to multiple preset as seen in [${compose.presetZone}] `);
            // when multiple presets, activate them and then proceed to create the sourceDict and apply as if no
            // presets
            compose.presetZone.forEach(async thePresetID => {
              sourceDict = { PresetId: thePresetID };
              await xapi.Command.Camera.Preset.Activate(sourceDict);
            })
          }


          if (REMOVE_EMPTY_SEGMENTS)
            Object.entries(AUX_CODEC_STATUS).forEach(([key, val]) => {
              //console.log(`Evaluating segment for ip ${key} with val = ${val}`)
              if (!val.haspeople) {
                // remove corresponding connectors if nobody in segement!
                console.log(`Trying to remove segment for ip ${key}`)
                aux_connectors_map[key].forEach(connectorID => {
                  the_connectors.splice(the_connectors.indexOf(connectorID), 1)
                })
              }
            })

          // check to see if the quadcam on the main codec sees people
          if (MAIN_CODEC_QUADCAM_SOURCE_ID != 0 && REMOVE_EMPTY_SEGMENTS) {
            let the_count = await xapi.Status.RoomAnalytics.PeopleCount.Current.get();
            if (the_count == 0) the_connectors.splice(the_connectors.indexOf(MAIN_CODEC_QUADCAM_SOURCE_ID), 1)
          }

          // do not allow the removal of all segments. If none have people, just show all meant for the 
          // overview
          if (the_connectors.length == 0) the_connectors = [...compose.connectors]

          if (webrtc_mode && the_connectors.length > 1) { //WebRTC mode does not support composing yet even in RoomOS11
            console.log(`Overview layout specifies connectors [${the_connectors}] and Layout: ${compose.layout}`);
            console.log(`No support for composing multiple inputs when in WebRTC, setting preset 30 only... `)
            xapi.command('Camera Preset Activate', { PresetId: 30 }).catch(handleError);
            // now set main video source to where the camera is connected
            let thePresetCameraID = await getPresetCamera(30)
            let thePresetVideoSource = MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[thePresetCameraID]
            setTimeout(function () {
              setMainVideoSource(thePresetVideoSource);
            }, VIDEO_SOURCE_SWITCH_WAIT_TIME);
          }
          else {
            console.log(`Setting Video Input to connectors [${the_connectors}] and Layout: ${compose.layout}`);
            sourceDict = { ConnectorId: the_connectors, Layout: compose.layout }

            await xapi.command('Camera Preset Activate', { PresetId: 30 }).catch(handleError);
            setTimeout(function () { xapi.Command.Video.Input.SetMainVideoSource(sourceDict) }, VIDEO_SOURCE_SWITCH_WAIT_TIME)

            const payload = { EditMatrixOutput: { sources: sourceDict["ConnectorId"] } };
            setTimeout(function () {
              //Let USB Macro know we are composing
              localCallout.command(payload).post()
            }, 250) //250ms delay to allow the main source to resolve first
          }
        }
      }
  })


  // send required messages to other codecs
  await sendIntercodecMessage('side_by_side');
  lastActiveHighInput = 0;
  lowWasRecalled = true;
}

async function recallFullPresenter() {
  console.log("Recalling full presenter in PresenterTrack mode....")
  // the Video Input SetMainVideoSource does not work while Speakertrack is active
  // so we need to pause it in case the we were doing full composition to be able to switch
  // to just the presenter camera
  pauseSpeakerTrack();
  if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Mute();

  let presenterSource = await xapi.Config.Cameras.PresenterTrack.Connector.get();
  console.log("Obtained presenter source as: ", presenterSource)
  let connectorDict = { ConnectorId: presenterSource };
  xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
  lastSourceDict = connectorDict;
  if (webrtc_mode && !isOSEleven) setTimeout(function () { xapi.Command.Video.Input.MainVideo.Unmute() }, WEBRTC_VIDEO_UNMUTE_WAIT_TIME);
  //resumeSpeakerTrack(); // we do not want to leave background mode on
}

async function recallQuadCam() {
  console.log("Recalling QuadCam after manually exiting PresenterTrack mode....")
  pauseSpeakerTrack();
  if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Mute();
  let currentSTCameraID = await xapi.Status.Cameras.SpeakerTrack.ActiveConnector.get(); //TODO: Test if it obtains the correct camera ID
  console.log('In recallQuadCam Obtained currentSTCameraID as: ', currentSTCameraID)
  let connectorDict = { SourceId: currentSTCameraID }; xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
  lastSourceDict = connectorDict;
  if (webrtc_mode && !isOSEleven) setTimeout(function () { xapi.Command.Video.Input.MainVideo.Unmute() }, WEBRTC_VIDEO_UNMUTE_WAIT_TIME);
  resumeSpeakerTrack(); // we do not want to leave background mode on


}

/////////////////////////////////////////////////////////////////////////////////////////
// TOUCH 10 UI FUNCTION HANDLERS
/////////////////////////////////////////////////////////////////////////////////////////

async function handleOverrideWidget(event) {
  let widgetId = event.WidgetId;

  if (widgetId === 'widget_override') {
    console.log("Camera Control button selected.....")
    if (event.Value === 'off') {

      console.log("Camera Control is set to Manual...");
      console.log("Stopping automation...")
      stopAutomation();
    }
    else {

      // start VuMeter monitoring
      console.log("Camera Control is set to Automatic...");
      console.log("Starting automation...")
      startAutomation();
    }

  }

  if (widgetId === 'widget_sbs_control') {
    console.log("Side by side control selected.....")
    if (event.Value === 'off') {
      console.log("Side by side control is set to overview...");
      perma_sbs = false;
    }
    else {
      console.log("Side by side control is set to always...");
      perma_sbs = true;
    }
    // trigger a cameraSwitch evaluation
    lastActiveHighInput = 0;
  }

  if (widgetId === 'widget_FS_selfview') {
    console.log("Selfview button selected.....")
    if (event.Value === 'off') {
      console.log("Selfview is set to Off...");
      console.log("turning off self-view...")
      xapi.Command.Video.Selfview.Set({ FullscreenMode: 'Off', Mode: 'Off', OnMonitorRole: 'First' });
    }
    else {
      console.log("Selfview is set to On...");
      console.log("turning on self-view...")
      // TODO: determine if turning off self-view should also turn off fullscreenmode
      xapi.Command.Video.Selfview.Set({ FullscreenMode: 'On', Mode: 'On', OnMonitorRole: 'First' });
    }
  }

  if (widgetId === 'widget_force_frames' && isOSEleven) {
    console.log("Force frames toggle button selected.....")
    manualSetFrames = true;
    if (event.Value === 'off') {
      forceFramesOn = false;
      xapi.Command.Cameras.SpeakerTrack.Frames.Deactivate();
      await sendIntercodecMessage('force_frames_off')

    }
    else {
      forceFramesOn = true;
      xapi.Command.Cameras.SpeakerTrack.Frames.Activate();
      await sendIntercodecMessage('force_frames_on')
    }

  }

  if (widgetId === 'widget_ov_settings') {
    if (event.Type == 'released')
      switch (event.Value) {
        case '1':
          console.log('Selected overview 1');
          if (overviewCompNames.length > 0) {
            currOverviewComp = overviewCompNames[0];
            console.log(`Overview name: ${currOverviewComp}`);
          } else console.log('Invalid overview selection...')
          break;

        case '2':
          console.log('Selected overview 2');
          if (overviewCompNames.length > 1) {
            currOverviewComp = overviewCompNames[1];
            console.log(`Overview name: ${currOverviewComp}`);
          } else console.log('Invalid overview selection...')
          break;

        case '3':
          console.log('Selected overview 3');
          if (overviewCompNames.length > 2) {
            currOverviewComp = overviewCompNames[2];
            console.log(`Overview name: ${currOverviewComp}`);
          } else console.log('Invalid overview selection...')
          break;

        case '4':
          console.log('Selected overview 4');
          if (overviewCompNames.length > 3) {
            currOverviewComp = overviewCompNames[3];
            console.log(`Overview name: ${currOverviewComp}`);
          } else console.log('Invalid overview selection...')
          break;

      }


  }

  if (widgetId === 'widget_pt_settings') {
    let presenterSource = 0;
    let connectorDict = {};
    if (presenterTrackConfigured) {
      if (event.Type == 'released')
        switch (event.Value) {
          case '1':
            console.log('Off');
            console.log("Turning off PresenterTrack...");
            //recallFullPresenter();
            xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
            PRESENTER_QA_MODE = false;
            if (MAIN_CODEC_QUADCAM_SOURCE_ID != 0) {
              activateSpeakerTrack();
              recallQuadCam();
            }
            break;

          case '2':
            console.log('On');
            console.log("Turning on PresenterTrack only...");
            if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Mute();
            deactivateSpeakerTrack();
            presenterSource = await xapi.Config.Cameras.PresenterTrack.Connector.get();
            connectorDict = { ConnectorId: presenterSource };
            xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
            lastSourceDict = connectorDict;
            if (webrtc_mode && !isOSEleven) setTimeout(function () { xapi.Command.Video.Input.MainVideo.Unmute() }, WEBRTC_VIDEO_UNMUTE_WAIT_TIME);
            xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Persistent' });
            PRESENTER_QA_MODE = false;
            break;

          case '3':
            console.log('QA Mode');
            console.log("Turning on PresenterTrack with QA Mode...");
            if (webrtc_mode && !isOSEleven) xapi.Command.Video.Input.MainVideo.Mute();
            activateSpeakerTrack(); //TODO: test if not activating speakertrack here when you have an SP60 allows it to work in QA mode
            //pauseSpeakerTrack();
            presenterSource = await xapi.Config.Cameras.PresenterTrack.Connector.get();
            connectorDict = { ConnectorId: presenterSource };
            xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
            lastSourceDict = connectorDict;
            xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Persistent' });
            pauseSpeakerTrack();
            if (webrtc_mode && !isOSEleven) setTimeout(function () { xapi.Command.Video.Input.MainVideo.Unmute() }, WEBRTC_VIDEO_UNMUTE_WAIT_TIME);

            PRESENTER_QA_MODE = true;
            //resumeSpeakerTrack();
            break;

        }
    }
    else {
      console.log("PresenterTrack not configured!!!");
    }

  }
}



function addCustomAutoQAPanel() {

  let presenterTrackButtons = `
  <Name>PresenterTrack</Name>
  <Widget>
    <WidgetId>widget_pt_settings</WidgetId>
    <Type>GroupButton</Type>
    <Options>size=4</Options>
    <ValueSpace>
      <Value>
        <Key>1</Key>
        <Name>Off</Name>
      </Value>
      <Value>
        <Key>2</Key>
        <Name>On w/o QA</Name>
      </Value>
      <Value>
        <Key>3</Key>
        <Name>On with QA</Name>
      </Value>
    </ValueSpace>
  </Widget>
  `;
  let presenterTrackButtonsDisabled = `
  <Name>PresenterTrack</Name>
  <Widget>
    <WidgetId>widget_pt_disabled</WidgetId>
    <Name>Not configured</Name>
    <Type>Text</Type>
    <Options>size=3;fontSize=normal;align=center</Options>
  </Widget>`;

  // Here we do the conditional assignment of the row
  let presenterTrackRowValue = (presenterTrackConfigured) ? presenterTrackButtons : presenterTrackButtonsDisabled;

  // add custom control panel for turning on/off automatic mode
  if (ALLOW_PRESENTER_QA_MODE) {
    xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: 'panel_auto_qa' },
      `<Extensions>
      <Version>1.9</Version>
      <Panel>
        <Origin>local</Origin>
        <Location>HomeScreenAndCallControls</Location>
        <Icon>Camera</Icon>
        <Color>#07C1E4</Color>
        <Name>PresenterTrack</Name>
        <ActivityType>Custom</ActivityType>
        <Page>
          <Name>PresenterTrack Control</Name>
          <Row>
          ${presenterTrackRowValue}
          </Row>
          <PageId>panel_auto_qa</PageId>
          <Options/>
        </Page>
      </Panel>
    </Extensions>
      `);
  } else xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'panel_auto_qa' });

  if (presenterTrackConfigured && ALLOW_PRESENTER_QA_MODE) {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'widget_pt_settings', Value: '1' }).catch(handleMissingWigetError);
  }

}

/////////////////////////////////////////////////////////////////////////////////////////
// ERROR HANDLING
/////////////////////////////////////////////////////////////////////////////////////////

function handleError(error) {
  console.log(error);
}

function handleMissingWigetError(error) {
  console.log('Trying to set widget that is not being shown...');
}


/////////////////////////////////////////////////////////////////////////////////////////
// INTER-MACRO MESSAGE HANDLING
/////////////////////////////////////////////////////////////////////////////////////////

async function updateUSBModeConfig() {
  var object = { AlterUSBConfig: { config: 'matrix_Camera_Mode', value: true } }
  await localCallout.command(object).post()
}


GMM.Event.Receiver.on(async event => {
  const usb_mode_reg = /USB_Mode_Version_[0-9]*.*/gm
  if ((typeof event) != 'string')
    if ('RawMessage' in event) {
      // here we are receiving a RawMessage as marked by GMM, so it could be from an external controller
      //first check to ese if it is a custom MIC_ACTIVE Event
      let theEventValue = event.RawMessage;
      let activeMic = '';
      if (theEventValue.slice(0, 11) == 'MIC_ACTIVE_') {
        console.warn("Received unformatted MIC_ACTIVE_XX message: ", event.RawMessage)
        activeMic = theEventValue.substring(11);
        processExternalMicHandler(activeMic);
      }
      if (theEventValue == 'EXEC_SW_MACRO_DISABLE') {
        console.log('Received EXEC_SW_MACRO_DISABLE')
        tempDisable = true;
      }

      if (theEventValue == 'EXEC_SW_MACRO_ENABLE') {
        console.log('Received EXEC_SW_MACRO_ENABLE')
        tempDisable = false;
      }

    } else
      if (event.Source.Id == 'localhost') {
        // we are evaluating a local event, first check to see if from the USB Mode macro
        if (usb_mode_reg.test(event.App)) {
          if (event.Type == 'Error') {
            console.error(event)
          } else {
            switch (event.Value) {
              case 'Initialized':
                console.warn(`USB mode initialized...`)
                updateUSBModeConfig();
                break;
              case 'EnteringWebexMode': case 'Entering_Default_Mode': case 'EnteringDefaultMode':
                console.warn(`You are entering Webex Mode`)
                //Run code here when Default Mode starts to configure
                break;
              case 'WebexModeStarted': case 'DefaultModeStarted':
                console.warn(`System is in Default Mode`)
                stopAutomation();
                usb_mode = false;
                // always tell the other codec when your are in or out of a call
                //otherCodec.status('CALL_DISCONNECTED').post();

                break;
              case 'enteringUSBMode':
                console.warn(`You are entering USB Mode`)
                //Run code here when USB Mode starts to configure
                break;
              case 'USBModeStarted':
                if (!tempDisable) {
                  console.warn(`System is in Default Mode`)
                  startAutomation();
                  usb_mode = true;
                  // always tell the other codec when your are in or out of a call
                  //otherCodec.status('CALL_CONNECTED').post();
                } else {
                  console.warn(`Entering USB Mode, but tempDisable==true `)
                }
                break;
              default:
                break;
            }
          }
        }
        else {
          console.debug({
            Message: `Received Message from ${event.App} and was not processed`
          })
        }
      }
      else if (event.App == 'Crestron') { //message is coming from an external controller that identifies as 'Crestron'
        console.warn("Received from app Crestron: ", event.Value)
        if (event.Type == 'Error') {
          console.error(event)
        } else {
          //first check to ese if it is a custom MIC_ACTIVE Event
          let theEventValue = event.Value;
          let activeMic = '';
          if (theEventValue.slice(0, 11) == 'MIC_ACTIVE_') {
            activeMic = theEventValue.substring(11);
            processExternalMicHandler(activeMic);
          }
          else {
            console.debug({
              Message: `Received Message from ${event.App} was not processed`
            })
          }
        }

      }
      else //this is coming from an aux codec or some other external source
        switch (event.Value) {
          case "VTC-1_OK":
            handleCodecOnline(event.Source?.IPv4);
            break;
          case "aux_has_people":
            handleCodecPeopleReport(event.Source?.IPv4, true)
            break;
          case "aux_no_people":
            handleCodecPeopleReport(event.Source?.IPv4, false)
            break;
          default:
            break;
        }

})



/////////////////////////////////////////////////////////////////////////////////////////
// INTER-CODEC COMMUNICATION
/////////////////////////////////////////////////////////////////////////////////////////



async function sendIntercodecMessage(message) {
  // only send if there are aux codecs configured
  if (Object.keys(auxCodecs).length != 0) {
    console.log(`sendIntercodecMessage to all aux codecs: message = ${message}`);
    await auxCodecs.status(message).passIP().queue().catch(e => {
      alertFailedIntercodecComm("Error connecting to codec for second camera, please contact the Administrator");
    });
  }
}



GMM.Event.Queue.on(report => {
  //The queue will continuously log a report to the console, even when it's empty.
  //To avoid additional messages, we can filter the Queues Remaining Requests and avoid it if it's equal to Empty
  if (report.QueueStatus.RemainingRequests != 'Empty') {
    report.Response.Headers = [] // Clearing Header response for the simplicity of the demo, you may need this info
    //console.log(report)
  }
});

function alertFailedIntercodecComm(message) {
  xapi.command("UserInterface Message Alert Display", {
    Text: message
    , Duration: 10
  }).catch((error) => { console.error(error); });
}

/////////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONAL HANDLERS
/////////////////////////////////////////////////////////////////////////////////////////


function handleMicMuteOn() {
  console.log('handleMicMuteOn');
  lastActiveHighInput = 0;
  lowWasRecalled = true;
  recallSideBySideMode();
}

function handleMicMuteOff() {
  console.log('handleMicMuteOff');
  // need to turn back on SpeakerTrack that might have been turned off when going on mute
  //if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
  if (MAIN_CODEC_QUADCAM_SOURCE_ID > 0) resumeSpeakerTrack();

}

// ---------------------- MACROS



// function to check the satus of the macros running on the AUX codec
async function handleMacroStatus() {
  console.log('handleMacroStatus');

  // reset tracker of responses from aux codecs
  Object.entries(AUX_CODEC_STATUS).forEach(([key, val]) => {
    val.online = false;
  })
  // send a status request to all AUX codecs 
  await sendIntercodecMessage('VTC-1_status');
}

function handleCodecOnline(codecIP) {
  if (codecIP in AUX_CODEC_STATUS) {
    if (AUX_CODEC_STATUS[codecIP].enable) {
      console.log(`handleCodecOnline: codec = ${codecIP}`);
      AUX_CODEC_STATUS[codecIP].online = true;
    }
  }
  else {
    console.warn(`No codec with IP ${codecIP} configured when receiving online report.`)
  }
}

function handleCodecPeopleReport(codecIP, seespeople) {
  if (codecIP in AUX_CODEC_STATUS) {
    if (AUX_CODEC_STATUS[codecIP].enable) {
      console.log(`handleCodecPeopleReport: codec = ${codecIP} seespeople= ${seespeople}`);
      AUX_CODEC_STATUS[codecIP].haspeople = seespeople
    }
  } else {
    console.warn(`No codec with IP ${codecIP} configured when receiving people report.`)
  }
}

async function handleWakeUp() {
  console.log('handleWakeUp');
  // stop automatic switching behavior
  stopAutomation();
  // send wakeup to AUX codec
  await sendIntercodecMessage('wake_up');
  // check the satus of the macros running on the AUX codec and store it in AUX_CODEC.online
  // in case we need to check it in some other function
  setTimeout(handleMacroStatus, 2000);
}

async function handleShutDown() {
  console.log('handleShutDown');
  // send required messages to other codecs
  await sendIntercodecMessage('shut_down');
}

/////////////////////////////////////////////////////////////////////////////////////////
// VARIOUS TIMER HANDLER FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function startSideBySideTimer() {
  if (sideBySideTimer == null) {
    allowSideBySide = false;
    sideBySideTimer = setTimeout(onSideBySideTimerExpired, SIDE_BY_SIDE_TIME);
  }
}

function stopSideBySideTimer() {
  if (sideBySideTimer != null) {
    clearTimeout(sideBySideTimer);
    sideBySideTimer = null;
  }
}

function restartSideBySideTimer() {
  stopSideBySideTimer();
  startSideBySideTimer();
}

function onSideBySideTimerExpired() {
  console.log('onSideBySideTimerExpired');
  allowSideBySide = true;
  recallSideBySideMode();
}



function startInitialCallTimer() {
  if (InitialCallTimer == null) {
    allowCameraSwitching = false;
    InitialCallTimer = setTimeout(onInitialCallTimerExpired, INITIAL_CALL_TIME);
  }
}

function onInitialCallTimerExpired() {
  console.log('onInitialCallTimerExpired');
  InitialCallTimer = null;
  if (!manual_mode) {
    allowCameraSwitching = true;

    //if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
    if (!presenterTracking) resumeSpeakerTrack();
  }
}

function stopInitialCallTimer() {
  if (InitialCallTimer != null) {
    clearTimeout(InitialCallTimer);
    InitialCallTimer = null;
  }
}


function startCompositionTimer() {
  if (qaCompositionTimer == null) {
    presenterQAKeepComposition = true;
    qaCompositionTimer = setTimeout(onCompositionTimerExpired, PRESENTER_QA_KEEP_COMPOSITION_TIME)
  }
}

function stopCompositionTimer() {
  if (qaCompositionTimer != null) {
    clearTimeout(qaCompositionTimer);
    qaCompositionTimer = null;
  }
}

function restartCompositionTimer() {
  stopCompositionTimer();
  startCompositionTimer();
}

function onCompositionTimerExpired() {
  presenterQAKeepComposition = false;
  if (PRESENTER_QA_MODE && !webrtc_mode && (presenterTracking && presenterDetected)) {
    if (!PRESENTER_QA_AUDIENCE_MIC_IDS.includes(lastActiveHighInput)) {
      // restore single presentertrackview because the person still speaking
      // is not an audience member and the timer has expired (could also be due to silence)
      recallFullPresenter();
    }
  }
}


function startNewSpeakerTimer() {
  if (newSpeakerTimer == null) {
    allowNewSpeaker = false;
    newSpeakerTimer = setTimeout(onNewSpeakerTimerExpired, NEW_SPEAKER_TIME);
  }
}

function stopNewSpeakerTimer() {
  if (newSpeakerTimer != null) {
    clearTimeout(newSpeakerTimer);
    newSpeakerTimer = null;
  }
}

function restartNewSpeakerTimer() {
  stopNewSpeakerTimer();
  startNewSpeakerTimer();
}

function onNewSpeakerTimerExpired() {
  allowNewSpeaker = true;
}

function activateSpeakerTrack() {
  console.log(`activating speakertrack....`)
  xapi.Command.Cameras.SpeakerTrack.Activate().catch(handleError);

}

function deactivateSpeakerTrack() {
  console.log(`deactivating speakertrack....`)
  xapi.Command.Cameras.SpeakerTrack.Deactivate().catch(handleError);
}

function resumeSpeakerTrack() {
  if (USE_ST_BG_MODE) xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Deactivate().catch(handleError);
  else xapi.Command.Cameras.SpeakerTrack.Activate().catch(handleError);
}

function pauseSpeakerTrack() {
  if (USE_ST_BG_MODE) xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Activate().catch(handleError);
  else xapi.Command.Cameras.SpeakerTrack.Deactivate().catch(handleError);
}


/////////////////////////////////////////////////////////////////////////////////////////
// INVOCATION OF INIT() TO START THE MACRO
/////////////////////////////////////////////////////////////////////////////////////////

// if the Speakertrack Camera becomes available after FW upgrade, we must re-init so
// we register that action as an event handler
xapi.Status.Cameras.SpeakerTrack.Availability
  .on((value) => {
    console.log("Event received for SpeakerTrack Availability: ", value)
    if (value == "Available") {
      stopAutomation();
      init();
    }
  });


// register to receive Presenter Detected events when in PresenterTrack mode.
// This way we can disable logic for presentertracking if the presenter steps away
// from stage and re-engage once they come back. 
xapi.Status.Cameras.PresenterTrack.PresenterDetected.on(async value => {
  console.log('Received PT Presenter Detected as: ', value)
  if (value == 'True') {
    presenterDetected = true;
    let presenterSource = await xapi.Config.Cameras.PresenterTrack.Connector.get();
    let connectorDict = { ConnectorId: presenterSource };
    console.log("In PresenterDetected handler switching to input with SetMainVideoSource with dict: ", connectorDict)
    xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
    lastSourceDict = connectorDict;

  } else {
    presenterDetected = false;
    presenterQAKeepComposition = false;
    lastSourceDict = { SourceID: '0' }; // forcing a camera switch

  }
});

// register to keep track of when PresenterTrack is active or not
xapi.Status.Cameras.PresenterTrack.Status.on(async value => {
  console.log('Received PT status as: ', value)
  if (value === 'Follow' || value === 'Persistent') {
    if (!manual_mode) {

      presenterTracking = true;
      if (allowSideBySide) {
        allowSideBySide = false;
        let presenterSource = await xapi.Config.Cameras.PresenterTrack.Connector.get();
        let connectorDict = { ConnectorId: presenterSource };
        await xapi.Command.Video.Input.SetMainVideoSource(connectorDict);
        await xapi.Command.Cameras.PresenterTrack.Set({ Mode: value });
      }
    }
  }
  else {

    presenterTracking = false;
  }
  // Update custom panel
  evalPresenterTrack(value);
});


init();