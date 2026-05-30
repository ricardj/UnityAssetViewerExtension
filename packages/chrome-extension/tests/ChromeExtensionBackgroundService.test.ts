import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeExtensionBackgroundService } from '../src/ChromeExtensionBackgroundService';

// Define the shape of Chrome details
interface InstalledDetails {
  reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
}

// Create the mock for chrome API
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    getURL: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
};

// Expose mock as global `chrome` object
vi.stubGlobal('chrome', mockChrome);

describe('ChromeExtensionBackgroundService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('registers an onInstalled listener on bootstrap', () => {
    ChromeExtensionBackgroundService.bootstrap();

    // Check if addListener was called
    expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledOnce();
  });

  it('opens a popup when the extension is installed', () => {
    ChromeExtensionBackgroundService.bootstrap();

    // Get the listener function that was passed to addListener
    const listener = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0];

    // Setup mock return for getURL
    mockChrome.runtime.getURL.mockReturnValue('mock-popup-url.html');

    // Call the listener simulating an install
    listener({ reason: 'install' } as InstalledDetails);

    // Verify getURL was called with correct argument
    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('popup.html');

    // Verify tabs.create was called correctly
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({
      url: 'mock-popup-url.html',
      active: true
    });
  });

  it('does not open a popup when the extension is updated', () => {
    ChromeExtensionBackgroundService.bootstrap();

    // Get the listener function that was passed to addListener
    const listener = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0];

    // Call the listener simulating an update
    listener({ reason: 'update' } as InstalledDetails);

    // Verify that neither getURL nor tabs.create were called
    expect(mockChrome.runtime.getURL).not.toHaveBeenCalled();
    expect(mockChrome.tabs.create).not.toHaveBeenCalled();
  });
});
