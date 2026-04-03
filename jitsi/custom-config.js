// SmartOffice Jitsi config overrides
config.defaultLanguage = 'ja';
config.disableThirdPartyRequests = true;
config.prejoinConfig = { enabled: false };
config.disableDeepLinking = true;
config.hideConferenceSubject = true;
config.localSubject = '';
// Hide Jitsi branding in feedback/end screens
config.feedbackPercentage = 0;
config.enableClosePage = false;
config.enableWelcomePage = false;
// Prevent auto-disconnect when alone
config.p2p = { enabled: false };
config.channelLastN = -1;
config.enableLobbyChat = false;
