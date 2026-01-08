"""Base agent class for the multi-agent system."""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """Abstract base class for all agents."""
    
    def __init__(self, name: str, description: str):
        """
        Initialize base agent.
        
        Args:
            name: Human-readable agent name
            description: Description of agent's purpose
        """
        self.name = name
        self.description = description
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent's task.
        
        Args:
            input_data: Input parameters for the agent
        
        Returns:
            Output data from the agent
        """
        pass
    
    def __repr__(self):
        return f"{self.__class__.__name__}(name='{self.name}')"
