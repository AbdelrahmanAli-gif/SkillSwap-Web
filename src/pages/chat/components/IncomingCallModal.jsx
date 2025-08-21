import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export default function IncomingCallModal({ call, onAnswer, onReject, caller }) {
  const { t } = useTranslation();
  const [callerData, setCallerData] = useState(caller);

  useEffect(() => {
    if (!caller && call.callerId) {
      // Fetch caller data if not provided
      const fetchCallerData = async () => {
        const userDoc = await getDoc(doc(db, "users", call.callerId));
        if (userDoc.exists()) {
          setCallerData({ uid: call.callerId, ...userDoc.data() });
        }
      };
      fetchCallerData();
    }
  }, [call, caller]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-3xl">📞</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t("videoCall.incoming")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {callerData?.name || t("videoCall.unknownCaller")}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onReject}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center"
            >
              <span className="mr-2">❌</span>
              {t("videoCall.reject")}
            </button>
            <button
              onClick={onAnswer}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full flex items-center"
            >
              <span className="mr-2">✅</span>
              {t("videoCall.answer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}