'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
    useAppSelector,
    useAppDispatch,
    selectFollowRelationshipByUserId,
    selectFollowLoadingByUserId,
    setFollowRelationship,
    updateFollowStatus,
    setFollowLoading,
    setUpFollowers,
    setUpFollowings
} from '@/src/redux-store';
import { toggleFollow } from '@/src/libs/auth/actions/follow.actions';
import { getUserById } from '@/src/libs/auth/actions/user.actions';
import Button from '../atoms/Button';

interface ShowFollowButtonsProps {
    targetId: string | number;
    variant?: 'primary' | 'default' | 'secondary';
    size?: 'default' | 'lg';
}

function ShowFollowButtons({ targetId, variant, size }: ShowFollowButtonsProps) {
    const dispatch = useAppDispatch();
    const currentUserId = useAppSelector((state) => state.user.currentUser?.id);
    const relationship = useAppSelector(selectFollowRelationshipByUserId(Number(targetId)));
    const isLoading = useAppSelector(selectFollowLoadingByUserId(Number(targetId)));

    const [targetUserPrivate, setTargetUserPrivate] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        const initializeRelationship = async () => {
            if (currentUserId && !relationship && !isInitializing && Number(targetId) !== currentUserId) {
                setIsInitializing(true);
                try {
                    const result = await getUserById(targetId);
                    if (result.success && result.data) {
                        setTargetUserPrivate(result.data.is_private || false);

                        dispatch(setFollowRelationship({
                            userId: Number(targetId),
                            data: {
                                isFollowing: result.data.is_following || false,
                                isFollowedBy: result.data.is_followed_by || false,
                                isMutual: result.data.is_mutual || false,
                                followStatus: result.data.follow_status || null,
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                } finally {
                    setIsInitializing(false);
                }
            }
        };

        if (targetId && currentUserId && Number(targetId) !== currentUserId) {
            initializeRelationship();
        }
    }, [targetId, currentUserId, dispatch]);

    const getButtonText = () => {
        if (isLoading || isInitializing) return "Loading...";

        if (relationship?.isFollowing && relationship?.followStatus === "accepted") {
            return "Following";
        } else if (relationship?.followStatus === "pending") {
            return "Requested";
        }

        return "Follow";
    };

    const handleFollowToggle = useCallback(async () => {
        if (!currentUserId || isLoading) return;

        const previousState = { ...relationship };
        const newIsFollowing = !relationship?.isFollowing;

        dispatch(updateFollowStatus({
            userId: Number(targetId),
            isFollowing: newIsFollowing,
            followStatus: newIsFollowing
                ? targetUserPrivate ? "pending" : "accepted"
                : null,
        }));

        dispatch(setFollowLoading({ userId: Number(targetId), isLoading: true }));

        try {
            const result = await toggleFollow(Number(targetId));

            if (result.success && result.data) {
                if (result.data.followers) {
                    dispatch(setUpFollowers(result.data.followers));
                }
                if (result.data.followings) {
                    dispatch(setUpFollowings(result.data.followings));
                }

                dispatch(setFollowRelationship({
                    userId: Number(targetId),
                    data: {
                        isFollowing: result.data.is_following,
                        followStatus: result.data.status,
                    }
                }));

                dispatch(setFollowLoading({ userId: Number(targetId), isLoading: false }));
            } else {
                if (previousState) {
                    dispatch(setFollowRelationship({
                        userId: Number(targetId),
                        data: previousState
                    }));
                }
                dispatch(setFollowLoading({ userId: Number(targetId), isLoading: false }));
                console.error("Follow toggle failed:", result.errors);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            if (previousState) {
                dispatch(setFollowRelationship({
                    userId: Number(targetId),
                    data: previousState
                }));
            }
            dispatch(setFollowLoading({ userId: Number(targetId), isLoading: false }));
        }
    }, [currentUserId, isLoading, relationship, targetId, targetUserPrivate, dispatch]);

    if (!currentUserId) return null;
    if (currentUserId === Number(targetId)) {
        return null;
    }

    if (!relationship && (isLoading || isInitializing)) {
        return (
            <div>
                <Button
                    name="Loading..."
                    onClick={() => { }}
                    disabled={true}
                    variant={variant}
                    size={size}
                />
            </div>
        );
    }

    if (!relationship) {
        return (
            <div>
                <Button
                    name={getButtonText()}
                    onClick={handleFollowToggle}
                    disabled={isLoading || isInitializing}
                    variant={variant}
                    size={size}
                />
            </div>
        );
    }

    return (
        <div>
            <Button
                name={getButtonText()}
                onClick={handleFollowToggle}
                disabled={isLoading || isInitializing}
                variant={variant}
                size={size}
                fullWidth
            />
        </div>
    );
}

export default React.memo(ShowFollowButtons);