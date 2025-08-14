import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAPI } from "./ApiProvider";

const CurrentUserContext = createContext();

export const CurrentUserProvider = ({ children }) => {
  const api = useAPI();
  const [user, setUser] = useState();
  const [isInProgress, setIsInProgress] = useState(false);

  const fetch = useCallback(() => {
    setIsInProgress(true);
    api
      .callApi("me")
      .then((user) => {
        console.log('CurrentUser Debug - User fetched:', user);
        setUser(user);
      })
      .catch((error) => {
        console.error('CurrentUser Debug - Fetch error:', error);
      })
      .finally(() => setIsInProgress(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return <CurrentUserContext.Provider value={{ user, fetch, isInProgress }}>{children}</CurrentUserContext.Provider>;
};

export const useCurrentUser = () => useContext(CurrentUserContext) ?? {};
