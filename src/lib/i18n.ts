/**
 * YUKTHI Internationalization (i18n) Engine
 * Supported Languages:
 *   - English (en) [Default]
 *   - Telugu (te) [తెలుగు]
 *   - Hindi (hi) [हिन्दी]
 */

export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
];

export const STORAGE_LANG_KEY = 'yukthi_language';
export const LEGACY_STORAGE_LANG_KEY = 'finova_language';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
let memoryLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    const saved = (localStorage.getItem(STORAGE_LANG_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_LANG_KEY)) as SupportedLanguage;
    if (saved && (saved === 'en' || saved === 'te' || saved === 'hi')) {
      return saved;
    }
  }
  return memoryLanguage;
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  memoryLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    localStorage.setItem(LEGACY_STORAGE_LANG_KEY, lang);
    window.dispatchEvent(new CustomEvent('yukthi-language-changed', { detail: lang }));
    window.dispatchEvent(new CustomEvent('finova-language-changed', { detail: lang }));
  }
}

export const translations = {
  en: {
    // Brand & Common
    appName: 'YUKTHI',
    appSub: 'Smarter Payments. Safer Money.',
    tagline: 'Smarter Payments. Safer Money.',
    supportingText:
      'Check suspicious messages, track delayed payments, and plan your money with confidence in one simple place.',
    securityPledge:
      'Engineered for Indian digital payments. Zero credential harvesting, strict paise-level precision, and simple guidance.',

    // Navigation (Simplified & User-Friendly)
    navDashboard: 'Home',
    navScamChecker: 'Check for Scams',
    navPaymentAssistant: 'Payment Help',
    navCashFlow: 'Money Planner',
    navActionCentre: 'Alerts & Actions',
    navSettings: 'My Account',
    navWelcome: 'Welcome',
    navLogin: 'Log In',
    navSignUp: 'Sign Up',
    navLogout: 'Log Out',

    // Navigation Descriptions
    navDashboardDesc: 'See your money overview and important updates.',
    navScamCheckerDesc: 'Check if a payment request looks suspicious.',
    navPaymentAssistantDesc: 'Get help with failed, delayed, or missing payments.',
    navCashFlowDesc: 'Track money coming in, money going out, and upcoming expenses.',
    navActionCentreDesc: 'See important warnings and what you need to do next.',
    navSettingsDesc: 'Manage your profile and account preferences.',

    // Buttons & Actions
    btnLogIn: 'Log In',
    btnSignUp: 'Create Account',
    btnGetStarted: 'Get Started Now',
    btnAnalyzeMessage: 'Check This Message',
    btnLaunchDashboard: 'Go to Home',
    btnContinue: 'Continue',
    btnCancel: 'Cancel',
    btnBack: 'Back',
    btnSave: 'Save Changes',
    btnSkip: 'Skip for Now & Go to Home',
    btnStartVerification: 'Start Verification',
    btnShow: 'Show',
    btnHide: 'Hide',
    btnSwitchAccount: 'Switch Account',

    // Welcome Page Features
    featScamTitle: 'Check for Scams',
    featScamDesc:
      'Check if a payment request, SMS, or WhatsApp alert looks suspicious before you click or send money.',
    featPaymentTitle: 'Payment Help',
    featPaymentDesc:
      'Get step-by-step help with failed, delayed, or missing payments with standard bank timelines.',
    featCashFlowTitle: 'Money Planner',
    featCashFlowDesc:
      'Track money coming in, money going out, and upcoming expenses so you always know what is safe to spend.',

    // Login Form
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Log in to your secure YUKTHI workspace.',
    loginIdentifierLabel: 'Email Address or Mobile Number',
    loginIdentifierPlaceholder: 'name@example.com or 9876543210',
    loginPasswordLabel: 'Password',
    loginPasswordPlaceholder: 'Enter your password',
    loginRememberMe: 'Remember me on this device',
    loginForgotPassword: 'Forgot password?',
    loginSubmitButton: 'Log In to YUKTHI',
    loginNoAccountText: 'Don’t have an account?',
    loginNoAccountLink: 'Create an account',
    loginPrivacyNote:
      'By logging in, you access YUKTHI with local privacy isolation. Passwords are never stored in browser storage.',

    // Sign Up Form
    signupTitle: 'Create your YUKTHI Account',
    signupSubtitle: 'Take control of your money and payments with total transparency and security.',
    signupFullNameLabel: 'Full Name',
    signupFullNamePlaceholder: 'e.g. Priya Sharma',
    signupEmailLabel: 'Email Address',
    signupEmailPlaceholder: 'name@example.com',
    signupMobileLabel: 'Mobile Number (10 Digits)',
    signupMobilePlaceholder: '9876543210',
    signupPasswordLabel: 'Password',
    signupPasswordPlaceholder: 'Create a password (min 8 characters)',
    signupConfirmPasswordLabel: 'Confirm Password',
    signupConfirmPasswordPlaceholder: 'Re-enter your password',
    signupLanguageLabel: 'Preferred Language',
    signupTermsLabel: 'I accept the Terms of Service & Privacy Policy',
    signupSubmitButton: 'Create Account & Continue',
    signupHaveAccountText: 'Already have an account?',
    signupHaveAccountLink: 'Log In',
    signupPasswordRule: 'Minimum 8 characters with at least 1 number and 1 letter.',

    // Identity / Aadhaar Verification
    aadhaarTitle: 'Identity Verification',
    aadhaarNotice:
      'Verify your identity through an authorized verification process. YUKTHI will only use verification information necessary for the service.',
    aadhaarStatusNotStarted: 'Not Started',
    aadhaarStatusPending: 'Pending Provider Callback',
    aadhaarStatusUnconfigured: 'Verification integration not configured',
    aadhaarStatusVerified: 'Verified',
    aadhaarStatusFailed: 'Verification Failed',
    aadhaarPrototypeNotice:
      'PROTOTYPE NOTICE: Live UIDAI / DigiLocker ASA credentials are required for production biometric/OTP verification. YUKTHI never collects or stores raw Aadhaar numbers, OTPs, or biometrics directly.',
    aadhaarHelpTitle: 'Need Assistance or Want to Skip?',
    aadhaarHelpText:
      'Aadhaar verification is optional for basic scam analysis, dispute guidance, and money planning. You can safely proceed to Home without verification.',

    // Validation & Error Messages
    errRequired: 'This field is required.',
    errInvalidEmail: 'Please enter a valid email address (e.g. name@example.com).',
    errInvalidPhone: 'Please enter a valid 10-digit Indian mobile number.',
    errPasswordLength: 'Password must be at least 8 characters.',
    errPasswordMismatch: 'Passwords do not match. Please re-type your password.',
    errAcceptTerms: 'Please accept the Terms and Privacy Policy to continue.',
    errInvalidCredentials: 'The details you entered do not match. Please check and try again.',
    errNetwork: 'Unable to connect. Please check your internet connection and try again.',

    // Success Messages
    successLoggedIn: 'Successfully logged in. Opening your YUKTHI Home...',
    successAccountCreated: 'Account created successfully! Taking you to the next step...',
  },

  te: {
    // Brand & Common
    appName: 'YUKTHI',
    appSub: 'తెలివైన చెల్లింపులు. సురక్షితమైన డబ్బు.',
    tagline: 'తెలివైన చెల్లింపులు. సురక్షితమైన డబ్బు.',
    supportingText:
      'అనుమానాస్పద సందేశాలను తనిఖీ చేయండి, నిలిచిపోయిన చెల్లింపుల సహాయం పొందండి మరియు మీ డబ్బును సులభంగా ప్లాన్ చేయండి.',
    securityPledge:
      'భారతీయ డిజిటల్ ఆర్థిక పర్యావరణ వ్యవస్థ కోసం రూపొందించబడింది. పాస్‌వర్డ్‌లు లేదా పిన్‌లు నిల్వ చేయబడవు, పైసల ఖచ్చితత్వం మరియు నమ్మకమైన అంచనాలు.',

    // Navigation
    navDashboard: 'హోమ్',
    navScamChecker: 'స్కామ్ తనిఖీ',
    navPaymentAssistant: 'చెల్లింపు సహాయం',
    navCashFlow: 'మనీ ప్లానర్',
    navActionCentre: 'హెచ్చరికలు & చర్యలు',
    navSettings: 'నా ఖాతా',
    navWelcome: 'స్వాగతం',
    navLogin: 'లాగిన్',
    navSignUp: 'ఖాతా సృష్టించండి',
    navLogout: 'లాగ్ అవుట్',

    // Navigation Descriptions
    navDashboardDesc: 'మీ డబ్బు సారాంశం మరియు తాజా అప్‌డేట్‌లను చూడండి.',
    navScamCheckerDesc: 'చెల్లింపు అభ్యర్థన అనుమానాస్పదంగా ఉందో లేదో తనిఖీ చేయండి.',
    navPaymentAssistantDesc: 'విఫలమైన లేదా ఆలస్యమైన చెల్లింపులతో సహాయం పొందండి.',
    navCashFlowDesc: 'వచ్చే డబ్బు, ఖర్చులు మరియు రాబోయే చెల్లింపులను ట్రాక్ చేయండి.',
    navActionCentreDesc: 'ముఖ్యమైన హెచ్చరికలు మరియు తదుపరి చర్యలను చూడండి.',
    navSettingsDesc: 'మీ ప్రొఫైల్ మరియు ప్రాధాన్యతలను నిర్వహించండి.',

    // Buttons & Actions
    btnLogIn: 'లాగిన్',
    btnSignUp: 'ఖాతా సృష్టించండి',
    btnGetStarted: 'ఇప్పుడే ప్రారంభించండి',
    btnAnalyzeMessage: 'ఈ సందేశాన్ని తనిఖీ చేయండి',
    btnLaunchDashboard: 'హోమ్‌కు వెళ్లండి',
    btnContinue: 'కొనసాగించండి',
    btnCancel: 'రద్దు చేయండి',
    btnBack: 'వెనుకకు',
    btnSave: 'మార్పులను భద్రపరచండి',
    btnSkip: 'ఇప్పటికి దాటవేసి హోమ్‌కు వెళ్లండి',
    btnStartVerification: 'సురక్షిత ధృవీకరణను ప్రారంభించండి',
    btnShow: 'చూపించు',
    btnHide: 'దాచు',
    btnSwitchAccount: 'ఖాతా మార్చండి',

    // Welcome Page Features
    featScamTitle: 'స్కామ్ తనిఖీ',
    featScamDesc:
      'చెల్లింపు అభ్యర్థన లేదా మెసేజ్ అనుమానాస్పదంగా ఉందో లేదో ఒక్క క్షణంలో తెలుసుకోండి.',
    featPaymentTitle: 'చెల్లింపు సహాయం',
    featPaymentDesc:
      'విఫలమైన లేదా పెండింగ్‌లో ఉన్న బదిలీలను నిబంధనల ప్రకారం పరిష్కరించుకోండి.',
    featCashFlowTitle: 'మనీ ప్లానర్',
    featCashFlowDesc:
      'ఖర్చులను సరిగ్గా అంచనా వేసి మీ డబ్బును సురక్షితంగా ఉంచుకోండి.',

    // Login Form
    loginTitle: 'తిరిగి స్వాగతం',
    loginSubtitle: 'మీ సురక్షిత YUKTHI ఖాతాలోకి లాగిన్ అవ్వండి.',
    loginIdentifierLabel: 'ఈమెయిల్ చిరునామా లేదా మొబైల్ నంబర్',
    loginIdentifierPlaceholder: 'name@example.com లేదా 9876543210',
    loginPasswordLabel: 'పాస్‌వర్డ్',
    loginPasswordPlaceholder: 'మీ పాస్‌వర్డ్‌ను నమోదు చేయండి',
    loginRememberMe: 'ఈ పరికరంలో నన్ను గుర్తుంచుకో',
    loginForgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    loginSubmitButton: 'YUKTHI లోకి లాగిన్ అవ్వండి',
    loginNoAccountText: 'ఖాతా లేదా?',
    loginNoAccountLink: 'ఖాతా సృష్టించండి',
    loginPrivacyNote:
      'లాగిన్ చేయడం ద్వారా, మీరు డేటా భద్రతతో YUKTHI ని యాక్సెస్ చేస్తారు. పాస్‌వర్డ్‌లు బ్రౌజర్‌లో నిల్వ చేయబడవు.',

    // Sign Up Form
    signupTitle: 'మీ YUKTHI ఖాతాను సృష్టించండి',
    signupSubtitle: 'పూర్తి స్పష్టత మరియు భద్రతతో ఆర్థిక సమస్యలను ఎదుర్కొనడం ప్రారంభించండి.',
    signupFullNameLabel: 'పూర్తి పేరు',
    signupFullNamePlaceholder: 'ఉదా: ప్రియా శర్మ',
    signupEmailLabel: 'ఈమెయిల్ చిరునామా',
    signupEmailPlaceholder: 'name@example.com',
    signupMobileLabel: 'మొబైల్ నంబర్ (10 అంకెలు)',
    signupMobilePlaceholder: '9876543210',
    signupPasswordLabel: 'పాస్‌వర్డ్',
    signupPasswordPlaceholder: 'బలమైన పాస్‌వర్డ్‌ను రూపొందించండి',
    signupConfirmPasswordLabel: 'పాస్‌వర్డ్‌ను నిర్ధారించండి',
    signupConfirmPasswordPlaceholder: 'పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి',
    signupLanguageLabel: 'ప్రాధాన్యత గల భాష',
    signupTermsLabel: 'నేను సేవా నిబంధనలు & గోప్యతా విధానాన్ని అంగీకరిస్తున్నాను',
    signupSubmitButton: 'ఖాతాను సృష్టించండి & కొనసాగించండి',
    signupHaveAccountText: 'ఇప్పటికే ఖాతా ఉందా?',
    signupHaveAccountLink: 'లాగిన్ అవ్వండి',
    signupPasswordRule: 'కనీసం 8 అక్షరాలు, 1 సంఖ్య మరియు 1 అక్షరం ఉండాలి.',

    // Identity / Aadhaar Verification
    aadhaarTitle: 'గుర్తింపు ధృవీకరణ',
    aadhaarNotice:
      'అధికారిక ప్రక్రియ ద్వారా మీ గుర్తింపును ధృవీకరించండి. YUKTHI అవసరమైన సమాచారాన్ని మాత్రమే నిబంధనల ప్రకారం ఉపయోగిస్తుంది.',
    aadhaarStatusNotStarted: 'ప్రారంభం కాలేదు',
    aadhaarStatusPending: 'ధృవీకరణ వేచి ఉంది',
    aadhaarStatusUnconfigured: 'ధృవీకరణ అనుసంధానం కాన్ఫిగర్ చేయబడలేదు',
    aadhaarStatusVerified: 'ధృవీకరించబడింది',
    aadhaarStatusFailed: 'ధృవీకరణ విఫలమైంది',
    aadhaarPrototypeNotice:
      'ప్రోటోటైప్ గమనిక: ప్రత్యక్ష UIDAI / డిజిలాకర్ ఆధారాలు ఉత్పత్తి కోసం అవసరం. YUKTHI ఎటువంటి ఆధార్ సంఖ్యలను, OTPలను నిల్వ చేయదు.',
    aadhaarHelpTitle: 'సహాయం కావాలా లేదా దాటవేయాలా?',
    aadhaarHelpText:
      'ప్రాథమిక స్కామ్ విశ్లేషణ మరియు నగదు ప్రవాహ ప్రణాళిక కోసం ఆధార్ ధృవీకరణ ఐచ్ఛికం. మీరు ధృవీకరణ లేకుండా నేరుగా హోమ్‌కు వెళ్లవచ్చు.',

    // Validation & Error Messages
    errRequired: 'ఈ వివరాలు అవసరం.',
    errInvalidEmail: 'దయచేసి సరైన ఈమెయిల్ చిరునామాను నమోదు చేయండి.',
    errInvalidPhone: 'దయచేసి 10 అంకెల భారతీయ మొబైల్ నంబర్‌ను నమోదు చేయండి.',
    errPasswordLength: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.',
    errPasswordMismatch: 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.',
    errAcceptTerms: 'కొనసాగడానికి నిబంధనలు మరియు గోప్యతా విధానాన్ని అంగీకరించాలి.',
    errInvalidCredentials: 'చెల్లని ఆధారాలు. దయచేసి మీ వివరాలను తనిఖీ చేయండి.',
    errNetwork: 'నెట్‌వర్క్ లోపం. దయచేసి ఇంటర్నెట్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',

    // Success Messages
    successLoggedIn: 'విజయవంతంగా లాగిన్ అయ్యారు. హోమ్‌కు మళ్లించబడుతోంది...',
    successAccountCreated: 'ఖాతా విజయవంతంగా సృష్టించబడింది! ముందుకు సాగుతోంది...',
  },

  hi: {
    // Brand & Common
    appName: 'YUKTHI',
    appSub: 'स्मार्ट भुगतान। सुरक्षित धन।',
    tagline: 'स्मार्ट भुगतान। सुरक्षित धन।',
    supportingText:
      'संदिग्ध संदेशों की जाँच करें, रुके हुए भुगतानों में मदद पाएं और अपने पैसों की योजना आसानी से बनाएं।',
    securityPledge:
      'भारत के डिजिटल वित्त पारिस्थितिकी तंत्र के लिए तैयार। कोई पासवर्ड या पिन संग्रह नहीं, सटीक पैसे-स्तरीय गणना और सुरक्षित अनुमान।',

    // Navigation
    navDashboard: 'होम',
    navScamChecker: 'स्कैम जाँच',
    navPaymentAssistant: 'भुगतान मदद',
    navCashFlow: 'मनी प्लानर',
    navActionCentre: 'अलर्ट और कार्य',
    navSettings: 'मेरा खाता',
    navWelcome: 'स्वागत',
    navLogin: 'लॉग इन',
    navSignUp: 'साइन अप',
    navLogout: 'लॉग आउट',

    // Navigation Descriptions
    navDashboardDesc: 'अपने पैसों का विवरण और महत्वपूर्ण अपडेट देखें।',
    navScamCheckerDesc: 'जाँचें कि क्या कोई भुगतान अनुरोध संदिग्ध लगता है।',
    navPaymentAssistantDesc: 'विफल, देर से या गायब भुगतानों में मदद प्राप्त करें।',
    navCashFlowDesc: 'आने वाले पैसे, खर्च और भविष्य के भुगतानों को ट्रैक करें।',
    navActionCentreDesc: 'महत्वपूर्ण चेतावनियां और आपको आगे क्या करना है, देखें।',
    navSettingsDesc: 'अपनी प्रोफ़ाइल और खाता प्राथमिकताएं प्रबंधित करें।',

    // Buttons & Actions
    btnLogIn: 'लॉग इन',
    btnSignUp: 'खाता बनाएं',
    btnGetStarted: 'अभी शुरू करें',
    btnAnalyzeMessage: 'यह संदेश जाँचें',
    btnLaunchDashboard: 'होम पर जाएं',
    btnContinue: 'जारी रखें',
    btnCancel: 'रद्द करें',
    btnBack: 'पीछे',
    btnSave: 'परिवर्तन सहेजें',
    btnSkip: 'अभी छोड़ें और होम पर जाएं',
    btnStartVerification: 'सत्यापन शुरू करें',
    btnShow: 'दिखाएं',
    btnHide: 'छुपाएं',
    btnSwitchAccount: 'खाता बदलें',

    // Welcome Page Features
    featScamTitle: 'स्कैम जाँच',
    featScamDesc:
      'पैसे भेजने से पहले देखें कि क्या कोई संदेश या लिंक धोखाधड़ी हो सकता है।',
    featPaymentTitle: 'भुगतान मदद',
    featPaymentDesc:
      'अटके हुए या विफल यूपीआई भुगतानों को सरकारी समयसीमा के अनुसार ट्रैक करें।',
    featCashFlowTitle: 'मनी प्लानर',
    featCashFlowDesc:
      'आने वाले और जाने वाले खर्चों का सरल हिसाब रखें ताकि बजट कभी न बिगड़े।',

    // Login Form
    loginTitle: 'वापसी पर स्वागत है',
    loginSubtitle: 'अपने सुरक्षित YUKTHI खाते में लॉग इन करें।',
    loginIdentifierLabel: 'ईमेल पता या मोबाइल नंबर',
    loginIdentifierPlaceholder: 'name@example.com या 9876543210',
    loginPasswordLabel: 'पासवर्ड',
    loginPasswordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    loginRememberMe: 'इस डिवाइस पर मुझे याद रखें',
    loginForgotPassword: 'पासवर्ड भूल गए?',
    loginSubmitButton: 'YUKTHI में लॉग इन करें',
    loginNoAccountText: 'खाता नहीं है?',
    loginNoAccountLink: 'खाता बनाएं',
    loginPrivacyNote:
      'लॉग इन करके आप डेटा सुरक्षा के साथ YUKTHI का उपयोग करते हैं। पासवर्ड कभी भी ब्राउज़र में संग्रहीत नहीं होते हैं।',

    // Sign Up Form
    signupTitle: 'अपना YUKTHI खाता बनाएं',
    signupSubtitle: 'वित्तीय अनिश्चितताओं को स्पष्टता और सुरक्षा के साथ प्रबंधित करना शुरू करें।',
    signupFullNameLabel: 'पूरा नाम',
    signupFullNamePlaceholder: 'उदा: प्रिया शर्मा',
    signupEmailLabel: 'ईमेल पता',
    signupEmailPlaceholder: 'name@example.com',
    signupMobileLabel: 'मोबाइल नंबर (10 अंक)',
    signupMobilePlaceholder: '9876543210',
    signupPasswordLabel: 'पासवर्ड',
    signupPasswordPlaceholder: 'एक मजबूत पासवर्ड बनाएं',
    signupConfirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
    signupConfirmPasswordPlaceholder: 'अपना पासवर्ड पुनः दर्ज करें',
    signupLanguageLabel: 'पसंदीदा भाषा',
    signupTermsLabel: 'मैं सेवा की शर्तें और गोपनीयता नीति स्वीकार करता हूं',
    signupSubmitButton: 'खाता बनाएं और जारी रखें',
    signupHaveAccountText: 'क्या आपके पास पहले से खाता है?',
    signupHaveAccountLink: 'लॉग इन करें',
    signupPasswordRule: 'कम से कम 8 अक्षर, जिसमें कम से कम 1 संख्या और 1 अक्षर हो।',

    // Identity / Aadhaar Verification
    aadhaarTitle: 'पहचान सत्यापन',
    aadhaarNotice:
      'अधिकृत सत्यापन प्रक्रिया के माध्यम से अपनी पहचान सत्यापित करें। YUKTHI केवल सेवा के लिए आवश्यक न्यूनतम जानकारी का उपयोग करेगा।',
    aadhaarStatusNotStarted: 'शुरू नहीं हुआ',
    aadhaarStatusPending: 'प्रदाता उत्तर की प्रतीक्षा में',
    aadhaarStatusUnconfigured: 'सत्यापन एकीकरण कॉन्फ़िगर नहीं है',
    aadhaarStatusVerified: 'सत्यापित',
    aadhaarStatusFailed: 'सत्यापन विफल',
    aadhaarPrototypeNotice:
      'प्रोटोटाइप सूचना: उत्पादन बायोमेट्रिक/ओटीपी सत्यापन के लिए वास्तविक यूआईडीएआई/डिजिलॉकर क्रेडेंशियल्स की आवश्यकता होती है। YUKTHI कभी भी आधार संख्या या ओटीपी संग्रहीत नहीं करता है।',
    aadhaarHelpTitle: 'मदद चाहिए या छोड़ना चाहते हैं?',
    aadhaarHelpText:
      'स्कैम विश्लेषण और मनी प्लानिंग के लिए आधार सत्यापन वैकल्पिक है। आप बिना सत्यापन के सीधे होम पर जा सकते हैं।',

    // Validation & Error Messages
    errRequired: 'यह विवरण आवश्यक है।',
    errInvalidEmail: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
    errInvalidPhone: 'कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें।',
    errPasswordLength: 'पासवर्ड कम से कम 8 अक्षर लंबा होना चाहिए।',
    errPasswordMismatch: 'पासवर्ड मेल नहीं खाते।',
    errAcceptTerms: 'जारी रखने के लिए कृपया शर्तें और गोपनीयता नीति स्वीकार करें।',
    errInvalidCredentials: 'अमान्य क्रेडेंशियल्स। कृपया अपने विवरण की जाँच करें।',
    errNetwork: 'नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',

    // Success Messages
    successLoggedIn: 'सफलतापूर्वक लॉग इन किया गया। होम पर निर्देशित किया जा रहा है...',
    successAccountCreated: 'खाता सफलतापूर्वक बनाया गया! आगे बढ़ रहे हैं...',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || (key as string);
}
