// frontend/src/app/(dashboard)/dashboard/links/page.js
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const MAX_LINKS = 8; // Define how many link slots to show

export default function LinksPage() {
    const [links, setLinks] = useState(Array(MAX_LINKS).fill({ title: '', url: '' }));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchLinks = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/links');
                const fetchedLinks = response.data || [];
                
                // Create a new array with fetched links and fill the rest with empty slots
                const displayLinks = [...fetchedLinks];
                while (displayLinks.length < MAX_LINKS) {
                    displayLinks.push({ title: '', url: '' });
                }
                setLinks(displayLinks);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load your links.");
            } finally {
                setLoading(false);
            }
        };
        fetchLinks();
    }, []);

    // Function to handle changes in any input field
    const handleLinkChange = (index, field, value) => {
        const updatedLinks = [...links];
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
        setLinks(updatedLinks);
    };
    
    // Function to clear a link slot
    const clearLink = (index) => {
        handleLinkChange(index, 'title', '');
        handleLinkChange(index, 'url', '');
    };

    // Main save function
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Filter out empty slots before sending to the backend
        const linksToSave = links.filter(link => link.title.trim() !== '' && link.url.trim() !== '');

        // Client-side validation
        for (const link of linksToSave) {
            try {
                new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
            } catch (_) {
                setError(`The URL "${link.url}" is not valid. Please correct it.`);
                setSaving(false);
                return;
            }
        }

        try {
            const response = await apiClient.post('/links/bulk-update', { links: linksToSave });
            
            // Re-populate the form with the saved data (which will be ordered)
            // and fill the rest with empty slots.
            const savedLinks = response.data || [];
            const displayLinks = [...savedLinks];
            while (displayLinks.length < MAX_LINKS) {
                displayLinks.push({ title: '', url: '' });
            }
            setLinks(displayLinks);
            setSuccess('Your links have been saved successfully!');
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred while saving your links.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading your links...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Manage Your Links</h1>
            <p className="text-gray-500 mb-6">Add, edit, or remove the links that appear on your public profile. Clear both fields to remove a link.</p>

            {error && <p className="mb-4 p-3 bg-red-100 text-red-600 rounded-md">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 text-green-600 rounded-md">{success}</p>}
            
            <form onSubmit={handleSaveChanges}>
                <div className="space-y-6">
                    {links.map((link, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="font-semibold text-gray-700">Link #{index + 1}</label>
                                {/* Only show clear button if the slot has content */}
                                {(link.title || link.url) && (
                                    <button
                                        type="button"
                                        onClick={() => clearLink(index)}
                                        className="text-xs text-gray-500 hover:text-red-500 flex items-center"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    value={link.title}
                                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                                    placeholder="Title (e.g., My Website)"
                                    className="flex-grow w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md text-black"
                                />
                                <input
                                    type="text" // Use text to allow for URLs without http://
                                    value={link.url}
                                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                    placeholder="URL (e.g., example.com)"
                                    className="flex-grow w-full md:w-2/3 px-3 py-2 border border-gray-300 rounded-md text-black"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-10 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}