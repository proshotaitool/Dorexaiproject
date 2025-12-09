
import { Innertube, UniversalCache } from 'youtubei.js';
import * as fs from 'fs';

async function debugMonetization(input: string) {
    console.log('Debugging monetization for:', input);
    try {
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        let videoId = '';

        // Check if input is video ID or URL
        if (input.length === 11) {
            videoId = input;
        } else {
            // Try to extract or resolve
            // For now assume input is a video ID for simplicity in debug
            videoId = input;
        }

        console.log('Fetching info for Video ID:', videoId);
        const info = await youtube.getInfo(videoId);

        console.log('Info Keys:', Object.keys(info));

        const debugData = {
            // @ts-ignore
            microformat: info.microformat,
            // @ts-ignore
            player_response: info.player_response,
            basic_info: info.basic_info,
            // @ts-ignore
            primary_info: info.primary_info,
            // @ts-ignore
            secondary_info: info.secondary_info
        };

        fs.writeFileSync('debug-monetization.json', JSON.stringify(debugData, null, 2));
        console.log('Wrote debug data to debug-monetization.json');

        // Log specific fields we are looking for
        // @ts-ignore
        console.log('isMonetizationEnabled:', info.microformat?.playerMicroformatRenderer?.isMonetizationEnabled);
        // @ts-ignore
        console.log('adPlacements length:', info.player_response?.adPlacements?.length);
        // @ts-ignore
        console.log('playerAds length:', info.player_response?.playerAds?.length);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Use a known monetized video ID. 
// Example: "jNQXAC9IVRw" (Me at the zoo - likely not monetized but good for structure)
// Let's use a popular music video or something likely monetized.
// T-Series video: "v=6M17aG_Po2Y" (Example)
// Or the user's channel's video if we can find one.
// Let's try a generic popular video ID known to have ads.
debugMonetization('jfKfPfyJRdk'); // lofi hip hop radio (usually monetized/ads)
