import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProviderWrapper } from "@/components/ConvexProvider";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Discovery from "@/pages/Discovery";
import FreshFaces from "@/pages/FreshFaces";
import Pulse from "@/pages/Pulse";
import Upload from "@/pages/Upload";
import Subscriptions from "@/pages/Subscriptions";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import SignUp from "@/pages/SignUp";
import Events from "@/pages/Events";
import Settings from "@/pages/Settings";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <ConvexProviderWrapper>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="fresh-faces" element={<FreshFaces />} />
            <Route path="pulse" element={<Pulse />} />
            <Route path="events" element={<Events />} />
            <Route path="upload" element={<Upload />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscription-success" element={<SubscriptionSuccess />} />
            <Route path="admin" element={<Admin />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConvexProviderWrapper>
  );
}

export default App;
