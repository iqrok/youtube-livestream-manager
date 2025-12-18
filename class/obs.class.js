const OBSWebSocket = require('obs-websocket-js').default;

class OBS {
    constructor(config) {
        this.obs = new OBSWebSocket();
        this.config = config;
        this.connected = false;
    }

    async connect() {
        if (this.connected) return;
        try {
            await this.obs.connect(this.config.address, this.config.password);
            console.log('Connected to OBS WebSocket');
            this.connected = true;
        } catch (error) {
            console.error('Failed to connect to OBS WebSocket:', error.message);
            throw error; // Re-throw to be handled by the caller
        }
    }

    async disconnect() {
        if (!this.connected) return;
        await this.obs.disconnect();
        console.log('Disconnected from OBS WebSocket');
        this.connected = false;
    }

    async setStreamKey(streamKey, rtmpUrl) {
        if (!this.connected) {
            throw new Error('Not connected to OBS. Cannot set stream key.');
        }

        try {
            console.log(`Setting OBS stream key to: ${streamKey}`);
            await this.obs.call('SetStreamServiceSettings', {
                streamServiceType: 'rtmp_custom',
                streamServiceSettings: {
                    server: rtmpUrl,
                    key: streamKey,
                },
            });
            console.log('OBS stream key set successfully.');
        } catch (error) {
            console.error('Error setting OBS stream key:', error.message);
            // Don't re-throw here, as failing to control OBS shouldn't stop the whole YouTube script
        }
    }

    async restartStream(streamKey, rtmpUrl) {
        if (!this.connected) {
            throw new Error('Not connected to OBS. Cannot restart stream.');
        }

        try {
            const { outputActive } = await this.obs.call('GetStreamStatus');
            if (outputActive) {
                console.log('OBS stream is active. Stopping it before updating settings...');
                await this.obs.call('StopStream');
                // Wait a moment for OBS to stop gracefully
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
            }
            
            await this.setStreamKey(streamKey, rtmpUrl);

            console.log('Starting OBS stream...');
            await this.obs.call('StartStream');
            console.log('OBS stream started.');

        } catch (error) {
            console.error('Error controlling OBS stream:', error.message);
            // Don't re-throw here, as failing to control OBS shouldn't stop the whole YouTube script
        }
    }
}

module.exports = OBS;
