'use client'

import Form, { FormField } from '@/src/app/components/organisms/Form'
import { RoleType } from '@/src/redux-store/slices/roles'
import React from 'react'
import { useAppDispatch } from '@/src/redux-store'
import { assignRoleThunk } from '@/src/redux-store/slices/roles'
import { useParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast';
import { removeMemberFromClubThunk } from '@/src/redux-store/slices/club'

function RoleSelect({
    roles,
    userId,
    onClose,
    method
}: {
    roles: RoleType[];
    userId: string | number;
    onClose?: () => void;
    method?: string;
}) {
    const params = useParams()
    const clubId = params.id as string
    const dispatch = useAppDispatch()

    const options = roles.map((role) => ({
        value: role.id.toString(),
        label: role.name,
    }))

    const roleSelectForm: FormField[] = [
        {
            name: 'role_id',
            label: 'Select Role',
            type: 'select',
            options: options,
            required: true,
            placeholder: 'Choose a role...'
        }
    ]

    const onSubmit = async (data: any) => {
        try {
            console.log('Assigning role:', {
                clubId,
                userId,
                roleId: data.role_id
            });

            if (method === 'remove') {
                toast.success('Member removed successfully!');
                return
            }

            if (method === 'assign') {
                await dispatch(assignRoleThunk({
                    clubId,
                    userId: userId.toString(),
                    data: { role_id: data.role_id, assign: true }
                })).unwrap();

                toast.success('Role assigned successfully!');
            }

            if (onClose) {
                onClose();
            }
        } catch (error: any) {
            console.error('Failed to assign role:', error);
            toast.error(error.message || 'Failed to assign role');
        }
    }

    return (
        <div>
            <Form
                fields={roleSelectForm}
                onSubmit={onSubmit}
                submitButton={{ text: 'Assign Role' }}
            />
            <Toaster position="bottom-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 5000,
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
        </div>
    )
}

export default RoleSelect