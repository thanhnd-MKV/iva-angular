// ==========================================
//  DEVELOPMENT - Localhost 
// ==========================================
export const environment = {
    production: false,
    apiUrl: 'http://localhost:4200',
    SSO_SERVER: 'https://sso-demo.mkvision.com',
    SSO_SERVER_URL_PREFIX: '/ssoServer',
    APP_SERVER: 'http://localhost:4200',
    CHECKCODE_URL: 'sso/checkCode',
    PARAM_NAME_SSO_CODE: 'sso_code'
};



// ==========================================
//  PRODUCTION  (Comment/Uncomment khi deploy)
// ==========================================
// export const environment = {
//     production: true,
//     apiUrl: 'https://iva-demo.mkvision.com',
//     SSO_SERVER: 'https://sso-demo.mkvision.com',
//     SSO_SERVER_URL_PREFIX: '/ssoServer',
//     APP_SERVER: 'https://iva-demo.mkvision.com',
//     CHECKCODE_URL: 'sso/checkCode',
//     PARAM_NAME_SSO_CODE: 'sso_code'
// };

// ==========================================
// 🏢 INTERNAL SERVER - 10.30.100.135 (Backup option)
// ==========================================
// export const environment = {
//     production: false,
//     apiUrl: 'http://10.30.100.135:3290',
//     SSO_SERVER: 'http://10.30.100.135:2678',
//     SSO_SERVER_URL_PREFIX: '/ssoServer',
//     APP_SERVER: 'http://10.30.100.135:4200',
//     CHECKCODE_URL: 'sso/checkCode',
//     PARAM_NAME_SSO_CODE: 'sso_code'
// };