import process from "process";

import express from "express";
import morgan from "morgan";

const PORT = process.env.PORT || 5000;

import admin from "firebase-admin"
const serviceAccount = require("./firebase-service-account.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


async function sendNotification(deviceId: string, alert: {title: string, body: string}, payload: { [key: string]: string; }) {
  if (!alert) throw "missing alert";
    const message = {
    token: deviceId,
    notification: {
      title: alert.title,
      body: alert.body
    },
    android: {
      priority: "high" as 'high'
    },
    apns: {
      headers: {
        'apns-priority': '10'
      }
    },
    data: payload,
  };

  admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}

//---- REST API ----

const app = express();
const router = express.Router();

app.use(morgan("tiny"));
app.use(express.json());
app.use("/", router);

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { authorization } = req.headers;
  const secret = authorization && authorization.split(" ")[1];
  if (secret && secret === process.env.SECRET) {
    next();
  } else {
    res.sendStatus(401);
  }
}

router.post("/notify", auth, async (req, res) => {
  const { deviceId, alert, payload } = req.body;

  (async () => {
    try {
      await sendNotification(deviceId, alert, payload || {});
      if(process.env.DEBUG) {
        console.info("Notification sent to", deviceId);
      }
    } catch (e: any) {
      console.error(e);
    }
  })();

  res.send({ success: true });
});

router.all("*", (_req, res) => res.sendStatus(404));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
