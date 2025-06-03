import { PlusIcon } from 'lucide-react'
import React from 'react'
import { useTopPanelContext } from '@/context/top-panel.context'

export default function AddBlock() {
    const { setActiveTopPanel } = useTopPanelContext();
    
    const handleAddBlock = () => {
        setActiveTopPanel('blocks');
    };
    
    return (
        <div className='py-12 px-10'>
            <button 
                className='bg-white group relative w-full border-2 border-dashed border-[#8A2BE2]/30 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#8A2BE2] hover:shadow-lg hover:shadow-[#8A2BE2]/10 cursor-pointer'
                onClick={handleAddBlock}
            >
                <div className='min-h-[120px] flex flex-col items-center justify-center p-4'>
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                        <div className='absolute -top-8 -left-8 w-16 h-16 rounded-full bg-[#8A2BE2]/5'></div>
                        <div className='absolute top-1/2 -right-8 w-20 h-20 rounded-full bg-[#8A2BE2]/5'></div>
                        <div className='absolute -bottom-10 left-1/3 w-24 h-24 rounded-full bg-[#8A2BE2]/5'></div>
                    </div>
                    
                    <div className='relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#8A2BE2]/10 mb-3 group-hover:bg-[#8A2BE2]/20 transition-colors duration-300'>
                        <span className='absolute w-full h-full rounded-full bg-[#8A2BE2]/10 animate-ping opacity-70'></span>
                        <PlusIcon className='h-6 w-6 text-[#8A2BE2]' />
                    </div>
                    
                    <div className='relative z-10 text-center'>
                        <h3 className='text-[#8A2BE2] font-medium text-lg'>Add New Section</h3>
                        <p className='text-muted-foreground text-sm mt-1'>Click to add content blocks</p>
                    </div>
                </div>
            </button>
        </div>
    )
}
