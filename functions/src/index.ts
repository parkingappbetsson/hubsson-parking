import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: 'AIzaSyB6rWaLwb8DsrYs7NMgZi0Avnqvun4k8UU',
  authDomain: 'hubsson-parking.firebaseapp.com',
  projectId: 'hubsson-parking',
  storageBucket: 'hubsson-parking.appspot.com',
  messagingSenderId: '1061531745136',
  appId: '1:1061531745136:web:dc6eb056860850f9ebedb5',
};
const app = admin.initializeApp(firebaseConfig);

export const checkSecretCode = functions.https.onCall(async (data: any) => {
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
});
