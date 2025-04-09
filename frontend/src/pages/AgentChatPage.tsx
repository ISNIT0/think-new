import { useParams } from 'react-router-dom';
import AgentChat from './AgentChat';
import ErrorState from '../components/ErrorState';

export default function AgentChatPage() {
    const { agentId } = useParams<{ agentId: string }>();

    if (!agentId) {
        return (
            <ErrorState 
                title="Invalid Agent ID" 
                message="No agent ID was provided. Please return to the home page and try again." 
            />
        );
    }

    return <AgentChat agentId={agentId} />;
} 