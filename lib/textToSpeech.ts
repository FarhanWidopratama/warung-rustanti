/**
 * Text-to-Speech utility using Web Speech API
 * Provides audio notifications for new orders in admin dashboard
 */

class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Check if TTS is supported in browser
   */
  isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Enable or disable TTS
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tts_enabled', enabled ? 'true' : 'false');
    }
  }

  /**
   * Get current enabled state
   */
  isEnabled(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tts_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
    return this.enabled;
  }

  /**
   * Speak text with Indonesian voice
   */
  speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    if (!this.isSupported() || !this.isEnabled()) {
      console.log('TTS not supported or disabled:', text);
      return;
    }

    // Cancel any ongoing speech
    this.synth!.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; // Indonesian
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = 1.0;

    // Try to use Indonesian voice if available
    const voices = this.synth!.getVoices();
    const indonesianVoice = voices.find(
      (voice) => voice.lang === 'id-ID' || voice.lang.startsWith('id')
    );

    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    utterance.onstart = () => {
      console.log('TTS started:', text);
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
    };

    this.synth!.speak(utterance);
  }

  /**
   * Announce new order with details
   */
  announceNewOrder(orderData: {
    customerName: string;
    orderNumber: string;
    total: number;
    itemCount: number;
  }) {
    const { customerName, orderNumber, total, itemCount } = orderData;

    const totalFormatted = new Intl.NumberFormat('id-ID').format(total);

    const message = `Ada pesanan baru dari ${customerName}. Nomor antrian ${orderNumber}. Total ${itemCount} item, ${totalFormatted} rupiah.`;

    this.speak(message);
  }

  /**
   * Announce order status change
   */
  announceOrderStatus(status: string, orderNumber: string) {
    const messages: { [key: string]: string } = {
      confirmed: `Pesanan ${orderNumber} sudah dibayar`,
      cooking: `Pesanan ${orderNumber} sedang dimasak`,
      ready: `Pesanan ${orderNumber} sudah siap`,
      completed: `Pesanan ${orderNumber} sudah diambil`,
    };

    const message = messages[status];
    if (message) {
      this.speak(message);
    }
  }

  /**
   * Test TTS with sample message
   */
  test() {
    this.speak('Halo, ini adalah tes notifikasi suara untuk Warung Bu Sri');
  }
}

// Export singleton instance
export const tts = new TextToSpeech();

// Load voices when they become available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices loaded
    console.log('TTS voices loaded');
  };
}
