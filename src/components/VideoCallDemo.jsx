import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import VideoCallButton from "./VideoCallButton";

export default function VideoCallDemo() {
  const { t } = useTranslation();
  const [demoUserId] = useState("demo_user_123");
  const [demoUserName] = useState("Demo User");

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          📹 Video Calling Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Experience real-time video communication with our WebRTC-powered calling system
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Features
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎥</span>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">
                  High-Quality Video
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Crystal clear video streaming with adaptive quality
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎤</span>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">
                  Clear Audio
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  HD audio with noise cancellation and echo suppression
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">
                  Secure & Private
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  End-to-end encrypted communication via WebRTC
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">
                  Cross-Platform
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Works on desktop, tablet, and mobile devices
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Try It Out
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="font-medium text-gray-800 dark:text-white">
                {demoUserName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Demo user for testing
              </p>
            </div>

            <div className="space-y-3">
              <VideoCallButton
                targetUserId={demoUserId}
                targetUserName={demoUserName}
                size="lg"
                variant="primary"
                className="w-full"
              />
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Click to start a video call (demo mode)
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 How It Works
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Click the video call button</li>
              <li>2. Allow camera & microphone access</li>
              <li>3. Wait for connection to establish</li>
              <li>4. Enjoy your video call!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Technical Implementation
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              Frontend
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
              <li>• React with hooks</li>
              <li>• WebRTC API</li>
              <li>• Responsive design</li>
              <li>• Multi-language support</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              Backend
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Firebase Firestore</li>
              <li>• Real-time signaling</li>
              <li>• User authentication</li>
              <li>• Call management</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              Communication
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
              <li>• WebRTC peer-to-peer</li>
              <li>• STUN/TURN servers</li>
              <li>• ICE candidate exchange</li>
              <li>• SDP offer/answer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
