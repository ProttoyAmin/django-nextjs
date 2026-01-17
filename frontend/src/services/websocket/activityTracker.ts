/**
 * Minimal WebSocket Activity Tracker
 * Purpose: connect, stay connected, send & receive messages
 */

import { updateUser, store } from "@/src/redux-store";
import { updateTargetUser } from "@/src/redux-store/slices/user";
import toast from "react-hot-toast";

const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/activity/";
const NOTIFICATIONS_WS_URL =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL || "ws://127.0.0.1:8000/ws/notifications/";

class ActivityTrackerService {
    private ws: WebSocket | null = null;
    private notificationWs: WebSocket | null = null;
    private heartbeatTimer: any = null;

    connect(accessToken: string) {
        if (this.ws) return;

        const url = `${WS_URL}?token=${accessToken}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("🟢 Activity WS connected");

            // 🔹 Start heartbeat
            this.heartbeatTimer = setInterval(() => {
                this.send({ type: "heartbeat" });
            }, 30000);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('data from websocket', data)

            if (data.type === "status_update") {
                store.dispatch(
                    updateTargetUser({
                        status: data.status,
                    })
                );
            }
        };

        this.ws.onclose = () => {
            console.log("🔴 Activity WS disconnected");
            this.cleanup();
        };

        this.ws.onerror = () => {
            this.cleanup();
        };

        // Also connect to notifications WebSocket
        this.connectNotifications(accessToken);
    }

    connectNotifications(accessToken: string) {
        if (this.notificationWs) return;

        const url = `${NOTIFICATIONS_WS_URL}?token=${accessToken}`;
        this.notificationWs = new WebSocket(url);

        this.notificationWs.onopen = () => {
            console.log("🔔 Notifications WS connected");
        };

        this.notificationWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('notification from websocket', data);

            // Handle new notification
            if (data.type === "new_notification") {
                const notification = data.notification;
                this.showNotificationToast(notification);
            }

            // Handle connection established
            if (data.type === "connection_established") {
                console.log(`🔔 Connected with ${data.unread_count} unread notifications`);
            }
        };

        this.notificationWs.onclose = () => {
            console.log("🔕 Notifications WS disconnected");
            this.notificationWs = null;
        };

        this.notificationWs.onerror = () => {
            this.notificationWs = null;
        };
    }

    private showNotificationToast(notification: any) {
        const verb = notification.verb;
        const actor = notification.primary_actor;
        const actorName = actor?.username || "Someone";

        let message = "";
        let icon = "🔔";

        switch (verb) {
            case "follow_request":
                message = `${actorName} requested to follow you`;
                icon = "👋";
                break;
            case "follow_accept":
                message = `${actorName} started following you`;
                icon = "✅";
                break;
            case "like":
                message = `${actorName} liked your post`;
                icon = "❤️";
                break;
            case "comment":
                message = `${actorName} commented on your post`;
                icon = "💬";
                break;
            default:
                message = notification.description || "You have a new notification";
        }

        toast(message, {
            icon: icon,
            duration: 4000,
            position: "bottom-right",
            style: {
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: "10px",
            },
        });

    }

    disconnect() {
        this.cleanup();
    }

    send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    sendNotification(data: any) {
        if (this.notificationWs?.readyState === WebSocket.OPEN) {
            this.notificationWs.send(JSON.stringify(data));
        }
    }

    private cleanup() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.notificationWs) {
            this.notificationWs.close();
            this.notificationWs = null;
        }
    }
}

export const activityTracker = new ActivityTrackerService();
