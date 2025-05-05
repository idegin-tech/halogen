import { PlusIcon } from 'lucide-react'
import React from 'react'

export default function AddBlock() {
    return (
        <div className='py-12'>
            <button 
                className='group relative w-full border-2 border-dashed border-primary/30 rounded-lg overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-b from-background to-background/80 cursor-pointer'
            >
                <div className='min-h-[120px] flex flex-col items-center justify-center p-4'>
                    {/* Decorative elements */}
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                        <div className='absolute -top-8 -left-8 w-16 h-16 rounded-full bg-primary/5'></div>
                        <div className='absolute top-1/2 -right-8 w-20 h-20 rounded-full bg-primary/5'></div>
                        <div className='absolute -bottom-10 left-1/3 w-24 h-24 rounded-full bg-primary/5'></div>
                    </div>
                    
                    {/* Plus icon with pulse animation */}
                    <div className='relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors duration-300'>
                        <span className='absolute w-full h-full rounded-full bg-primary/10 animate-ping opacity-70'></span>
                        <PlusIcon className='h-6 w-6 text-primary' />
                    </div>
                    
                    {/* Text */}
                    <div className='relative z-10 text-center'>
                        <h3 className='text-primary font-medium text-lg'>Add New Section</h3>
                        <p className='text-muted-foreground text-sm mt-1'>Drag and drop content blocks here</p>
                    </div>
                </div>
            </button>
        </div>
    )
}
