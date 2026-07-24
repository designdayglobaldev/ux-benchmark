import React from 'react';
import { Smallbox } from './Smallbox';

export interface ParagraphProps {
    icon: React.ReactNode;
    title: string;
    tags: Array<{ text: string; width?: string }>;
    description: string;
}

export function Paragraph({ icon, title, tags, description }: ParagraphProps) {
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center gap-[9px]">
                {icon}
                <span className="font-['Inter'] font-semibold text-[16px] leading-none text-[#E5E7EB]">
                    {title}
                </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
                {tags.map((tag, index) => (
                    <Smallbox key={index} text={tag.text} width={tag.width} />
                ))}
            </div>

            <p className="mt-4 font-['Inter'] font-normal text-[14px] leading-[20px] text-[#878787]">
                {description}
            </p>
        </div>
    );
}