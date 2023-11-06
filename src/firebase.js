require('dotenv').config();

const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function getFirebaseCredentials() {
  if (process.env.NODE_ENV === 'production') {
    // En producción, obtén las credenciales de Secret Manager
    const [version] = await client.accessSecretVersion({
      name: 'projects/descargalibros1/secrets/firebase-service-account/versions/latest',
    });

    const credentials = JSON.parse(version.payload.data.toString('utf8'));
    return cert(credentials);
  } else {
    // En desarrollo, usa las credenciales locales
    // Asegúrate de que tu archivo .env local tenga la variable GOOGLE_APPLICATION_CREDENTIALS
    // que apunte al archivo de credenciales de Firebase descargado
    const {initializeApp, applicationDefault} =  require("firebase-admin/app")
    const {getFirestore} =  require("firebase-admin/firestore");
    initializeApp({
        credential: applicationDefault()
    })
    const db = getFirestore();
    module.exports = {
    db,
    };
  }
}

initializeApp({
    credential: applicationDefault()
})
const db = getFirestore();
module.exports = {
db,
};

