'use client'

import React from 'react'
import { PostType } from '@/src/types/post'
import Form, { FormField } from './Form'
import { UseFormReturn } from 'react-hook-form'

interface UpdateProps {
    post?: PostType
    type?: 'post' | 'media'
    onFormMount?: (formMethods: UseFormReturn) => void
}

const Update = ({ post, type, onFormMount }: UpdateProps) => {

    const updateForm: FormField[] = [
        {
            name: 'content',
            label: 'Content',
            type: 'text',
            required: true,
            default: post?.content || ''
        }
    ]

    const onSubmit = (data: any) => {
        console.log('Form submitted:', data)
    }

    return (
        <div className="h-full">
            <Form
                fields={updateForm}
                onSubmit={onSubmit}
                onFormMount={onFormMount}
                submitButton={null}
                className="h-full"
            />
        </div>
    )
}

export default Update