import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  ADDRESSES, ADMIN_ADDRESS,
  CampusRewardTokenABI, AchievementNFTABI,
  ActivityManagerABI, RewardManagerABI, VotingABI,
} from '../contracts';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const isAdmin = account
    ? account.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
    : false;

  const isWrongNetwork = chainId !== null && chainId !== 11155111; // Sepolia

  // Build read-only contracts (no signer needed)
  const getReadContract = useCallback((name, abi) => {
    if (!provider) return null;
    return new ethers.Contract(ADDRESSES[name], abi, provider);
  }, [provider]);

  // Build write contracts (signer required)
  const getWriteContract = useCallback((name, abi) => {
    if (!signer) return null;
    return new ethers.Contract(ADDRESSES[name], abi, signer);
  }, [signer]);

  const contracts = {
    CRT: () => getReadContract('CampusRewardToken', CampusRewardTokenABI),
    NFT: () => getReadContract('AchievementNFT', AchievementNFTABI),
    Activity: () => getReadContract('ActivityManager', ActivityManagerABI),
    Reward: () => getReadContract('RewardManager', RewardManagerABI),
    Voting: () => getReadContract('Voting', VotingABI),

    CRTw: () => getWriteContract('CampusRewardToken', CampusRewardTokenABI),
    NFTw: () => getWriteContract('AchievementNFT', AchievementNFTABI),
    Activityw: () => getWriteContract('ActivityManager', ActivityManagerABI),
    Rewardw: () => getWriteContract('RewardManager', RewardManagerABI),
    Votingw: () => getWriteContract('Voting', VotingABI),
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install MetaMask.');
      return;
    }
    try {
      setConnecting(true);
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const network = await web3Provider.getNetwork();
      const web3Signer = web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (err) {
      console.error('Connect failed', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Refresh signer
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        setSigner(web3Provider.getSigner());
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto-reconnect if already authorized 
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        connect();
      }
    });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []); // eslint-disable-line

  const value = {
    account, provider, signer, chainId, isAdmin, isWrongNetwork,
    connecting, connect, disconnect, contracts,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
