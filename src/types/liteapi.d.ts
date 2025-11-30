declare global {
  interface Window {
    LiteAPI: {
      init: (config: {
        domain: string;
        deepLinkParams?: string;
        labelsOverride?: {
          searchAction?: string;
          placePlaceholderText?: string;
        };
      }) => void;
      Map: {
        create: (config: {
          selector: string;
          placeId: string;
          primaryColor?: string;
          currency?: string;
          hasSearchBar?: boolean;
        }) => void;
      };
      HotelsList: {
        create: (config: {
          selector: string;
          placeId: string;
          primaryColor?: string;
          hasSearchBar?: boolean;
          rows?: number;
          currency?: string;
        }) => void;
      };
    };
  }
}

export {};
