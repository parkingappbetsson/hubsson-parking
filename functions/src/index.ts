import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: 'AIzaSyD9RZ8BHR_3lHXI2SmCTbhBuj9CaslHVFY',
  authDomain: 'hubsson-parking.firebaseapp.com',
  projectId: 'hubsson-parking',
  storageBucket: 'hubsson-parking.appspot.com',
  messagingSenderId: '1061531745136',
  appId: '1:1061531745136:web:2d5a32fb2e7e1629ebedb5',
};
const app = admin.initializeApp(firebaseConfig);

export const checkSecretCode = functions.region('europe-west1').https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // context.app will be undefined if the request doesn't include a valid
    // App Check token.
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'The function must be called from an App Check verified app.'
      );
    }

    const firestore = admin.firestore(app);
    const docs = await firestore.collection('secret-code').listDocuments();
    const validSecretCode = (await docs[0].get()).get('secretCode');
    if (data.text === validSecretCode) {
      return { valid: true };
    }
    throw new functions.https.HttpsError(
      'permission-denied',
      'Secret code validation was not successful'
    );
  }
);
