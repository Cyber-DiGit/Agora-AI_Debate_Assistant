
import React from 'react';
import { GroundingSource } from '../types';
import Icon from './Icon';

interface SourceLinkProps {
  source: GroundingSource;
}

const SourceLink: React.FC<SourceLinkProps> = ({ source }) => {
  return (
    <li className="flex items-start">
      <span className="mr-2 mt-1 text-indigo-400"><Icon name="link" size="sm" /></span>
      <a
        href={source.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:underline hover:text-indigo-300 break-all"
        title={source.uri}
      >
        {source.title || new URL(source.uri).hostname}
      </a>
    </li>
  );
};

export default SourceLink;
