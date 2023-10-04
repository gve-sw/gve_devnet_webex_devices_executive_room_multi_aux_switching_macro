6/20/23 Updates:

- Added versioning in the macro comments (currently at version 1.0.3)
- Added event handling for PresenterTrack so automation with automatically turn off and then resume if you invoke presenterTrack during a call. No need to do it manually.
- Changes to GMM connection object instantiation to improve reliability
- Added ability to show composition of top N speakers based on audio activity
- Added the ability to remove segments in the overview shot coming from Aux codecs that do not report any participants sitting in front of the camera

6/29/23 Updates:

- Fixed setting of missing preset 30 so it works with cameras other than QuadCam
- Fixed topN speakers because it was not using the max_speakers attribute to limit how many to compose
- Added code to just warn when the wrong IP address for an Aux is configured and messages are received
- Added correct handling for 'Frames' when specified in the the ST_DEFAULT_BEHAVIOR constant.

7/10/23 Updates: (version 1.0.5)

- Added ability to force frames onto primary and all aux codecs mid-call using custom "Camera Control" custom panel with a new "Force Frames" toggle switch.

7/11/23 Updates: (version 1.0.6)

- Added PresenterTrack custom panel button to turn on/off the PresenterTrack feature and optionally enable an "Auto QA mode" which simulates Clasroom mode functionality.

7/25/23 Updates: (version 1.0.7)

- Fixed issue with the use of camera presets without any aux codecs
- Fixed issue where it was removing the main codec quadcam segment even if REMOVE_EMPTY_SEGMENTS was set to false
- Fixed broken link to diagrams .pdf in README

8/18/23 Updates: (version 1.0.8)

- Fixed issue with detecting activity on mics that are being monitored but not assiged to any particular composition
- Added the ability to configure multiple Overview compositions where the `mics` value is set to [0] so that in the Camera Control custom panel there will appear a selector for up to 4 such compostions ot use when the room falls silent or the mute button is pressed. If more than 4 overview compositions are configured, only the first 4 are used.

9/19/23 Updates (version 1.0.9)

- Added ability to detect when Frames is selected manually on Main and propagate to all Aux codecs
- Removed need to specify MAP_PTZ_CAMERA_VIDEO_SOURCE_ID, it is now auto-generated

9/28/23 Updates (version 1.0.10)

- Added support for Ethernet Mics like the Mic Pro
- Fixed error when coming out of Presentertrack mode when no Quadcam
- Added support for auto-trigger of presenterTrack so that you can keep it on from the custom  
  panel button (including QA mode) and have it stop tracking once you leave the stage and re-acquire  
  when you return to it.

9/28/23 Updates (version 1.0.11)

- Added support for USB Microphones

10/4/23 Updates (version 1.0.12)

- Limited USB mic support for when echo control is enabled for those interfaces
- Added way to store preset 30 pan/tilt/zoom values in macro constants to re-create always or when missing preset
- Added explicit commands to turn on Closeup mode for speakertracking when selected as default
