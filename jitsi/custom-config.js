// SmartOffice Jitsi config overrides
config.defaultLanguage = 'ja';
config.disableThirdPartyRequests = true;
config.prejoinConfig = { enabled: false };
config.disableDeepLinking = true;
config.hideConferenceSubject = true;
config.localSubject = '';
config.feedbackPercentage = 0;
config.enableClosePage = false;
config.enableWelcomePage = false;
config.p2p = { enabled: false };
config.channelLastN = -1;
config.enableLobbyChat = false;
// Disable breakout rooms and unnecessary moderator features
config.hideAddRoomButton = true;
config.breakoutRooms = { hideAddRoomButton: true };
config.disableRemoteMute = true;
config.remoteVideoMenu = { disableKick: true, disableGrantModerator: true };
config.disableModeratorIndicator = true;
config.enableInsecureRoomNameWarning = false;
config.doNotStoreRoom = true;
