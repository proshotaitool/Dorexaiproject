
import { Innertube, UniversalCache } from 'youtubei.js';
import * as fs from 'fs';

async function debugChannel(input: string) {
    console.log('Debugging channel fetch for:', input);
    try {
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        let channelId = '';

        if (input.startsWith('UC')) {
            channelId = input;
        }

        // Try to resolve URL first
        if (!channelId) {
            try {
                const resolved = await youtube.resolveURL(input);
                if (resolved && resolved.payload && resolved.payload.browseId) {
                    channelId = resolved.payload.browseId;
                    console.log('Resolved Channel ID:', channelId);
                }
            } catch (e) {
                console.log('Resolve failed, assuming input is ID or trying video lookup...');
            }
        }

        if (!channelId) {
            // Try video lookup
            try {
                const info = await youtube.getInfo(input); // input as video ID or URL
                if (info.basic_info.channel_id) {
                    channelId = info.basic_info.channel_id;
                    console.log('Found Channel ID from video:', channelId);
                }
            } catch (e) { }
        }

        if (channelId) {
            const channel = await youtube.getChannel(channelId);
            console.log('Channel Header Type:', channel.header?.type);
            console.log('Channel Header Keys:', channel.header ? Object.keys(channel.header) : 'No Header');

            if (channel.header) {
                const fs = require('fs');
                fs.writeFileSync('debug-output.json', JSON.stringify(channel.header, null, 2));
                console.log('Wrote header to debug-output.json');
            }

            if (channel.metadata) {
                console.log('Metadata:', JSON.stringify(channel.metadata, null, 2));
            }

        } else {
            console.log('Could not resolve channel ID.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run with a known channel or the one from the user's screenshot if possible.
// The user's screenshot shows ID: UCd9plCT_M_kPxF1fi5Wnb5A
debugChannel('UCd9plCT_M_kPxF1fi5Wnb5A');
