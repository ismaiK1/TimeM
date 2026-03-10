/**
 * Clé localStorage pour le JWT — partagée entre le store auth et le client API
 * pour éviter les dépendances circulaires.
 */
export const TOKEN_KEY = 'timetable_auth_token';
