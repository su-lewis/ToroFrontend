'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPageBlocks, savePageBlocks } from '@/app/actions'; 
import { LinkIcon, GiftIcon, Bars3Icon, TrashIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Sub-component for editing a LINK block
function LinkEditor({ block, onUpdate, onRemove }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Bars3Icon className="h-5 w-5 mr-2 cursor-grab" />
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Link</label>
                </div>
                <button type="button" onClick={onRemove} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center transition-colors">
                    <TrashIcon className="h-4 w-4 mr-1" />Remove
                </button>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    value={block.title || ''} 
                    onChange={(e) => onUpdate('title', e.target.value)} 
                    placeholder="Title (e.g., My Website)" 
                    className="flex-grow w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                    type="text" 
                    value={block.url || ''} 
                    onChange={(e) => onUpdate('url', e.target.value)} 
                    placeholder="URL (e.g., https://example.com)" 
                    className="flex-grow w-full md:w-2/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
                />
            </div>
        </div>
    );
}

// Sub-component for editing a WISHLIST block
function WishlistEditor({ block, onUpdate, onRemove }) {
    // Local state for string inputs to fix the backspace/typing bug
    const [priceStr, setPriceStr] = useState(block.priceCents ? (block.priceCents / 100).toFixed(2) : '50.00');
    const [quantityStr, setQuantityStr] = useState((block.quantityGoal || 1).toString());

    // Update parent state only when the user is done typing (onBlur)
    const handlePriceBlur = () => {
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum > 0) {
            onUpdate('priceCents', Math.round(priceNum * 100));
        } else {
            // Reset to a valid number if input is invalid
            setPriceStr('50.00');
            onUpdate('priceCents', 5000);
        }
    };
    
    const handleQuantityBlur = () => {
        const quantityNum = parseInt(quantityStr, 10);
        if (!isNaN(quantityNum) && quantityNum > 0) {
            onUpdate('quantityGoal', quantityNum);
        } else {
            // Reset to a valid number if input is invalid
            setQuantityStr('1');
            onUpdate('quantityGoal', 1);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Bars3Icon className="h-5 w-5 mr-2 cursor-grab" />
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Wishlist Item</label>
                </div>
                <button type="button" onClick={onRemove} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center transition-colors">
                    <TrashIcon className="h-4 w-4 mr-1" />Remove
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                    type="text" 
                    value={block.title || ''} 
                    onChange={(e) => onUpdate('title', e.target.value)} 
                    placeholder="Item Name (e.g., New Microphone)" 
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                    type="text" // Use text to allow decimal typing
                    value={priceStr} 
                    onChange={(e) => setPriceStr(e.target.value)} 
                    onBlur={handlePriceBlur}
                    placeholder="Price" 
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                />
                <div className="md:col-span-2 flex items-center gap-4">
                    <label htmlFor={`quantity-${block.clientId}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Goal:</label>
                    <input 
                        id={`quantity-${block.clientId}`}
                        type="text" // Use text to allow easier typing
                        value={quantityStr} 
                        onChange={(e) => setQuantityStr(e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={handleQuantityBlur}
                        disabled={block.isUnlimited} 
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                        <input id={`unlimited-${block.clientId}`} type="checkbox" checked={block.isUnlimited} onChange={(e) => onUpdate('isUnlimited', e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor={`unlimited-${block.clientId}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Unlimited</label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PageEditor() {
    const [blocks, setBlocks] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        startTransition(async () => {
            const result = await getPageBlocks(); 
            if (result.success) {
                const blocksWithClientIds = result.data.map(b => ({ ...b, clientId: Date.now() + Math.random() }));
                setBlocks(blocksWithClientIds);
            } else {
                setError(result.message || "Failed to load page content.");
            }
            setIsLoadingInitial(false);
        });
    }, []);

    const addBlock = (type) => {
        let newBlock;
        if (type === 'LINK') {
            newBlock = { clientId: Date.now(), type: 'LINK', title: '', url: '' };
        } else if (type === 'WISHLIST') {
            newBlock = { clientId: Date.now(), type: 'WISHLIST', title: '', priceCents: 5000, quantityGoal: 1, isUnlimited: true };
        }
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (clientId, field, value) => {
        setBlocks(blocks.map(b => b.clientId === clientId ? { ...b, [field]: value } : b));
    };

    const removeBlock = (clientId) => {
        setBlocks(blocks.filter(b => b.clientId !== clientId));
    };
    
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(blocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setBlocks(items);
    };

    const handleSaveChanges = async () => {
        setError(null); setSuccess(null);
        startTransition(async () => {
            const result = await savePageBlocks(blocks); 
            if (result.success) {
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        });
    };

    if (isLoadingInitial) {
        return <p className="text-center p-10 text-gray-500 dark:text-gray-400">Loading your page content...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Page Editor</h1>
                    <p className="text-gray-500 dark:text-gray-400">Add, edit, and reorder content for your public page.</p>
                </div>
                <button onClick={handleSaveChanges} disabled={isPending} className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {error && <p className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-md">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-md">{success}</p>}
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                            {blocks.map((block, index) => (
                                <Draggable key={block.clientId} draggableId={block.clientId.toString()} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            {block.type === 'LINK' && (
                                                <LinkEditor block={block} onUpdate={(f, v) => updateBlock(block.clientId, f, v)} onRemove={() => removeBlock(block.clientId)} />
                                            )}
                                            {block.type === 'WISHLIST' && (
                                                <WishlistEditor block={block} onUpdate={(f, v) => updateBlock(block.clientId, f, v)} onRemove={() => removeBlock(block.clientId)} />
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            
            <div className="mt-8 flex items-center justify-center gap-4">
                <button 
                    onClick={() => addBlock('LINK')} 
                    className="flex items-center gap-2 px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors">
                    <LinkIcon className="h-5 w-5" /> Add Link
                </button>
                <button 
                    onClick={() => addBlock('WISHLIST')} 
                    className="flex items-center gap-2 px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors">
                    <GiftIcon className="h-5 w-5" /> Add Wishlist Item
                </button>
            </div>
        </div>
    );
}