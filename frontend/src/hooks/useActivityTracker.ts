import { useEffect } from "react";
import { useAppSelector } from "@/src/redux-store";
import { activityTracker } from "@/src/services/websocket/activityTracker";
import { getAccessToken } from "../libs/utils/utils";

export function useActivityTracker() {
    const user = useAppSelector((state) => state.user.currentUser);

    useEffect(() => {
        if (!user?.id) {
            activityTracker.disconnect();
            return;
        }

        let mounted = true;

        (async () => {
            const token = await getAccessToken();
            if (token && mounted) {
                activityTracker.connect(token);
            }
        })();

        return () => {
            mounted = false;
            activityTracker.disconnect();
        };
    }, [user?.id]);
}
