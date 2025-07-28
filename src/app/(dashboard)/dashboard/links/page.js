// frontend/src/app/(dashboard)/dashboard/links/page.js
'use client';

import { useState, useEffect, useTransition } from 'react';
import { saveLinks } from '@/app/actions';
import { fetchProtectedDataFromServer } from '@/lib/server-api';
import { TrashIcon } from '@heroicons/react/24/outline';

const MAX_LINKS = 8;

async function getLinks() {
    'use server';
    try {
        const links = await fetchProtectedDataFromServer('/links');
        return { success: true, data: links };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export default function LinksPage() {
    const [links, setLinks] = useState(Array(MAX_LINKS).fill({ title: '', url: '' }));
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isPending, startTransition] = useTransition();

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
        });
    }, []);

    const handleLinkChange = (index, field, value) => {
        const updatedLinks = [...links];
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
        setLinks(updatedLinks);
    };
    
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        const linksToSave = links.filter(link => link.title.trim() !== '' && link.url.trim() !== '');
        startTransition(async () => {
            const result = await saveLinks(linksToSave);
            if (result.success) {
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        });
    };

    if (isPending && links.every(l => l.title === '')) { // Show loading only on initial fetch
        return <p>Loading your links...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Manage Your Links</h1>
            {error && <p className="mb-4 p-3 bg-red-100 text-red-600 rounded-md">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 text-green-600 rounded-md">{success}</p>}
            <form onSubmit={handleSaveChanges}>
                <div className="space-y-6">
                    {links.map((link, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                            <label className="font-semibold text-gray-700">Link #{index + 1}</label>
                            <div className="flex flex-col md:flex-row gap-4 mt-2">
                                <input type="text" value={link.title} onChange={(e) => handleLinkChange(index, 'title', e.target.value)} placeholder="Title" className="flex-grow w-full md:w-1/3 px-3 py-2 border rounded-md text-black" />
                                <input type="text" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} placeholder="URL (e.g., example.com)" className="flex-grow w-full md:w-2/3 px-3 py-2 border rounded-md text-black" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    <button type="submit" disabled={isPending} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-10 rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {isPending ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}