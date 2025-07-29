'use client';
import { useState, useEffect, useTransition } from 'react';
import { getLinks, saveLinks } from '@/app/actions';
import { TrashIcon } from '@heroicons/react/24/outline';

const MAX_LINKS = 8;

export default function LinksPage() {
    const [links, setLinks] = useState(Array(MAX_LINKS).fill({ title: '', url: '' }));
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        startTransition(async () => {
            const result = await getLinks();
            if (result.success) {
                const fetchedLinks = result.data || [];
                const displayLinks = [...fetchedLinks];
                while (displayLinks.length < MAX_LINKS) {
                    displayLinks.push({ title: '', url: '' });
                }
                setLinks(displayLinks);
            } else {
                setError(result.message);
            }
            setIsLoadingInitial(false);
        });
    }, []);

    const handleLinkChange = (index, field, value) => {
        const updatedLinks = [...links];
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
        setLinks(updatedLinks);
    };
    const clearLink = (index) => { handleLinkChange(index, 'title', ''); handleLinkChange(index, 'url', ''); };
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        const linksToSave = links.filter(link => link.title.trim() !== '' && link.url.trim() !== '');
        startTransition(async () => {
            const result = await saveLinks(linksToSave);
            if (result.success) {
                setSuccess(result.message);
                const savedLinks = result.data || []; const displayLinks = [...savedLinks];
                while (displayLinks.length < MAX_LINKS) { displayLinks.push({ title: '', url: '' }); }
                setLinks(displayLinks);
            } else {
                setError(result.message);
            }
        });
    };

    if (isLoadingInitial) return <p>Loading your links...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Manage Your Links</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add, edit, or remove the links for your public profile.</p>
            {error && <p className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-md">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-md">{success}</p>}
            <form onSubmit={handleSaveChanges}>
                <div className="space-y-6">
                    {links.map((link, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <label className="font-semibold text-gray-700 dark:text-gray-300">Link #{index + 1}</label>
                                {(link.title || link.url) && (<button type="button" onClick={() => clearLink(index)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center"><TrashIcon className="h-4 w-4 mr-1" />Clear</button>)}
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input type="text" value={link.title} onChange={(e) => handleLinkChange(index, 'title', e.target.value)} placeholder="Title (e.g., My Website)" className="flex-grow w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700" />
                                <input type="text" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} placeholder="URL (e.g., example.com)" className="flex-grow w-full md:w-2/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    <button type="submit" disabled={isPending} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-10 rounded-md hover:bg-blue-700 disabled:opacity-50">{isPending ? "Saving..." : "Save All Changes"}</button>
                </div>
            </form>
        </div>
    );
}